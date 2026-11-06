import Stripe from "stripe";

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
