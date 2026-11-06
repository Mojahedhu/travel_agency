import Stripe from "stripe";
import { appwriteConfig } from "../appwrite/client";
import type { TablesDB } from "appwrite";
import { parseTripData } from "./utils";

const { databaseId, tripCollectionId } = appwriteConfig;

// No apiVersion: uses the version bundled with your installed SDK
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
        url: `${process.env.APP_BASE_URL}/travel/${tripId}/success`,
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
    return { url: tripRow.payment_link };
  }

  // 3. Check Stripe to avoid orphan duplicate products if a previous attempt created one
  const existingProducts = await stripe.products.search({
    query: `metadata['tripId']:'${tripId}' AND active:'true'`,
  });

  let paymentUrl: string | null = null;

  if (existingProducts.data.length > 0) {
    const existingProduct = existingProducts.data[0];

    // Look for an existing active payment link for this product/price
    const paymentLinks = await stripe.paymentLinks.list({
      limit: 10,
    });
    const matchedLink = paymentLinks.data.find(
      (link) => link.metadata?.tripId === tripId && link.active,
    );

    if (matchedLink) {
      paymentUrl = matchedLink.url;
    } else if (existingProduct.default_price) {
      // Product exists but link didn't get created: create just the link
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

  // 4. If no Stripe product was ever created, parse trip details and create it
  if (!paymentUrl) {
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
