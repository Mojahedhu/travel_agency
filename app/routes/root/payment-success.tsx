import { useEffect } from "react";
import { Link, redirect, type LoaderFunctionArgs } from "react-router";
import confetti from "canvas-confetti";
import { LEFT_CONFETTI, RIGHT_CONFETTI } from "../../constants";
import type { Route } from "./+types/payment-success";
import { getTripById } from "../../appwrite/trip";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { tripId } = params;
  if (!tripId) {
    throw redirect("/");
  }
  // 1. Verify that the trip exists in the database
  const trip = await getTripById(tripId);
  if (!trip) {
    throw new Response("Trip Not Found", { status: 404 });
  }
  // 2. Verify Stripe payment completion (if Stripe is active in your environment)
  // Example Stripe verification:
  /*
  const paymentIntents = await stripe.paymentIntents.search({
    query: `metadata['tripId']:'${tripId}' AND status:'succeeded'`,
  });
  if (!paymentIntents.data || paymentIntents.data.length === 0) {
    // Booking is unpaid or unverified
    throw redirect(`/travel/${tripId}`);
  }
  */
  return { tripId, trip };
};

const PaymentSuccess = ({ loaderData }: Route.ComponentProps) => {
  useEffect(() => {
    confetti(LEFT_CONFETTI);
    confetti(RIGHT_CONFETTI);

    return () => {
      confetti.reset();
    };
  }, []);
  return (
    <main className="payment-success wrapper">
      <section>
        <article>
          <img src="/assets/icons/check.svg" className="size-24" />
          <h1>Thank & Welcome Aboard!</h1>

          <p>
            Your trip is booked - can't wait to have you on this adventure. Get
            ready to explore & make memories! ✨
          </p>

          <Link to={`/travel/${loaderData.tripId}`} className="w-full" replace>
            <span className="button-class h-11 w-full">
              <img
                src="/assets/icons/itinerary-button.svg"
                className="size-5"
              />
              <span className="p-16-semibold text-white">
                View Trip details
              </span>
            </span>
          </Link>
          <Link to={"/"} className="w-full" replace>
            <span className="button-class-secondary h-11 w-full drop-shadow-2xl">
              <img src="/assets/icons/arrow-left.svg" className="size-5" />
              <span className="p-16-semibold">Return to homepage</span>
            </span>
          </Link>
        </article>
      </section>
    </main>
  );
};

export default PaymentSuccess;
