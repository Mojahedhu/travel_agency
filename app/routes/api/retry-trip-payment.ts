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

  // 1. Handle JSON parsing separately to return 400 on malformed/empty request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return data(
      { error: "Invalid JSON or empty request body." },
      { status: 400 },
    );
  }

  const tripId = body?.tripId;
  if (!tripId || typeof tripId !== "string") {
    return data({ error: "A valid tripId is required." }, { status: 400 });
  }

  // 2. Handle business logic / server operations with 500 on unexpected failure
  try {
    const { url } = await ensureTripPaymentLink({ database, tripId });
    return data({ success: true, payment_link: url, isActive: true });
  } catch (err: any) {
    console.error("Retry payment link error:", err);
    return data({ error: "Failed to recreate payment link." }, { status: 500 });
  }
};
