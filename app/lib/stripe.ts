import Stripe from "stripe";
import { appwriteConfig } from "../appwrite/client";
import type { TablesDB } from "appwrite";
import { parseTripData } from "./utils";

const { databaseId, tripCollectionId } = appwriteConfig;

// No apiVersion: uses the version bundled with your installed SDK
// Lazy Stripe client instance
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not defined.");
    }
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
};

// Export a proxy so existing imports (e.g., `import { stripe } from ...`)
// don't break, while deferring initialization until an operation is invoked.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: keyof Stripe) {
    const client = getStripe();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const createProduct = async (
  name: string,
  description: string,
  images: string[],
  price: number,
  tripId: string,
) => {
  const product = await stripe.products.create({
    name,
    description,
    images,
    metadata: { tripId },
    default_price_data: {
      unit_amount: Math.round(price * 100),
      currency: "usd",
    },
  });

  const payment_link = await stripe.paymentLinks.create({
    line_items: [{ price: product.default_price as string, quantity: 1 }],
    metadata: { tripId },
    payment_intent_data: { metadata: { tripId } },
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${process.env.APP_BASE_URL}/travel/${tripId}/success?session_id={CHECKOUT_SESSION_ID}`,
      },
    },
  });

  return payment_link;
};

// Retry to add payment_link
interface EnsurePaymentLinkParams {
  database: TablesDB; // Appwrite Databases service instance
  tripId: string;
}

/**
 * Ensures a trip record has an active Stripe payment link.
 * If one already exists or was created during a failed attempt, it reuses it.
 * Otherwise, creates a new one and updates the database row.
 */
export async function ensureTripPaymentLink({
  database,
  tripId,
}: EnsurePaymentLinkParams): Promise<{ url: string }> {
  // 1. Fetch the trip row from the database
  const tripRow = await database.getRow({
    databaseId,
    tableId: tripCollectionId,
    rowId: tripId,
  });

  // 2. If it already has a payment link, return it immediately
  if (tripRow.payment_link) {
    // Check if this link is still active
    let isActive = false;
    try {
      for await (const link of stripe.paymentLinks.list({ limit: 100 })) {
        if (link.url === tripRow.payment_link && link.active) {
          isActive = true;
          break;
        }
      }
    } catch (err) {
      console.error("Failed to verify existing payment link status:", err);
    }
    if (isActive) {
      return { url: tripRow.payment_link };
    }
    // If not active, proceed to find or create an active one and update DB!
  }

  // Parse and validate expected price upfront
  const tripDetails = parseTripData(tripRow.tripDetails) as Trip;
  if (!tripDetails || typeof tripDetails.estimatedPrice !== "string") {
    throw new Error(`Trip ${tripId} has invalid or missing trip details.`);
  }
  const cleanedPrice = tripDetails.estimatedPrice
    .replace(/,/g, "")
    .replace(/[^0-9.]/g, "");
  const tripPrice = Math.round(parseFloat(cleanedPrice) * 100) / 100;
  if (Number.isNaN(tripPrice) || tripPrice <= 0) {
    throw new Error(
      `Trip ${tripId} has an invalid estimatedPrice: ${tripDetails.estimatedPrice}`,
    );
  }
  const expectedUnitAmount = Math.round(tripPrice * 100); // Amount in cents

  // 3. Check Stripe to avoid orphan duplicate products if a previous attempt created one
  const existingProducts = await stripe.products.search({
    query: `metadata['tripId']:'${tripId}' AND active:'true'`,
  });

  let paymentUrl: string | null = null;

  if (existingProducts.data.length > 0) {
    const existingProduct = existingProducts.data[0];

    // Look for an existing active payment link for this product/price
    // Look for an existing active payment link across all pages
    let matchedLink: Stripe.PaymentLink | undefined;
    for await (const link of stripe.paymentLinks.list({ limit: 100 })) {
      if (link.active && link.metadata?.tripId === tripId) {
        // Verify that the link's line item matches the expected price
        const lineItems = await stripe.paymentLinks.listLineItems(link.id, {
          limit: 1,
        });
        const item = lineItems.data[0];
        const unitAmount = item?.price?.unit_amount;
        if (unitAmount === expectedUnitAmount) {
          matchedLink = link;
          break;
        }
      }
    }

    if (matchedLink) {
      paymentUrl = matchedLink.url;
    } else if (existingProduct.default_price) {
      // Product exists but link didn't get created: create just the link
      // Product exists but link didn't get created or price changed: check if default_price matches
      const priceObj = await stripe.prices.retrieve(
        existingProduct.default_price as string,
      );
      if (priceObj.unit_amount === expectedUnitAmount) {
        const newLink = await stripe.paymentLinks.create({
          line_items: [
            { price: existingProduct.default_price as string, quantity: 1 },
          ],
          metadata: { tripId },
          payment_intent_data: { metadata: { tripId } },
          after_completion: {
            type: "redirect",
            redirect: {
              url: `${process.env.APP_BASE_URL}/travel/${tripId}/success`,
            },
          },
        });
        paymentUrl = newLink.url;
      }
    }
  }

  // 4. If no Stripe product was ever created, parse trip details and create it
  // 4. If no matching link/product with the correct price was found, create product and link
  if (!paymentUrl) {
    const paymentLink = await createProduct(
      tripDetails.name,
      tripDetails.description,
      tripRow.imageUrls || [],
      tripPrice,
      tripId,
    );
    paymentUrl = paymentLink.url;
  }

  // 5. Update the database row with the payment link
  await database.updateRow({
    databaseId,
    tableId: tripCollectionId,
    rowId: tripId,
    data: {
      payment_link: paymentUrl,
    },
  });

  return { url: paymentUrl };
}
