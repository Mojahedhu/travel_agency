import { data, type ActionFunctionArgs } from "react-router";
import { createSessionClient } from "../../appwrite/server";
import { ensureTripPaymentLink } from "../../lib/stripe";

// Usage in the frontend
export const action = async ({ request }: ActionFunctionArgs) => {
  const { user, database } = await createSessionClient(request);
  if (!user || !database) {
    return data(
      { error: "Unauthorized: You must be logged in to create a trip." },
      { status: 401 },
    );
  }
  const { tripId } = await request.json();

  const { url } = await ensureTripPaymentLink({ database, tripId });
  return data({ success: true, payment_link: url, isActive: true });
};
