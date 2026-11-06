import {
  redirect,
  useRevalidator,
  type LoaderFunctionArgs,
} from "react-router";
import { getAllTrips, getTripById } from "../../appwrite/trip";
import { cn, getFirstWord, parseTripData } from "../../lib/utils";
import type { Route } from "./+types/trip-details";
import { Header, InfoPill, TripCard } from "../../../components";
import {
  ButtonComponent,
  ChipDirective,
  ChipListComponent,
  ChipsDirective,
} from "@syncfusion/ej2-react-buttons";
import { getUser } from "../../appwrite/auth";
import { useState } from "react";

export const clientLoader = async ({ params }: LoaderFunctionArgs) => {
  const user = await getUser();
  if (!user) return redirect("/sign-in");
  if (user.status !== "admin") return redirect("/");

  const { tripId } = params;
  if (!tripId) throw new Error("Trip ID is required");

  const [trip, trips] = await Promise.all([
    getTripById(tripId),
    getAllTrips(4, 0).catch((error) => {
      console.error("Failed to load popular trips:", error);
      return { allTrips: [], total: 0 };
    }),
  ]);

  if (!trip) throw new Response("Trip not found", { status: 404 });

  return {
    trip,
    allTrips: trips.allTrips.flatMap(({ $id, tripDetails, imageUrls }: any) => {
      const parsed = parseTripData(tripDetails);
      return parsed ? [{ id: $id, ...parsed, imageUrls: imageUrls ?? [] }] : [];
    }),
  };
};

const TripDetails = ({ loaderData }: Route.ComponentProps) => {
  const revalidator = useRevalidator();
  const trip = loaderData?.trip;
  const tripId = trip?.$id;
  const [paymentLink, setPaymentLink] = useState<string | null>(
    trip?.payment_link || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageUrls = loaderData?.trip?.imageUrls || [];
  const tripData = parseTripData(loaderData?.trip?.tripDetails);

  const {
    name,
    duration,
    itinerary: storedItinerary,
    travelStyle,
    groupType,
    budget,
    interests,
    estimatedPrice,
    description,
    bestTimeToVisit,
    weatherInfo,
    country,
  } = tripData || {};

  const itinerary: DayPlan[] = Array.isArray(storedItinerary)
    ? storedItinerary
    : [];

  const allTrips = loaderData.allTrips as Trip[] | [];

  const pillItems = [
    { text: travelStyle, bg: "!bg-pink-50 !text-pink-500" },
    { text: groupType, bg: "!bg-primary-50 !text-primary-500" },
    { text: budget, bg: "!bg-success-50 !text-success-700" },
    { text: interests, bg: "!bg-navy-50 !text-navy-500" },
  ];

  const visitTimeAndWeatherInfo = [
    { title: "Best Time to Visit", items: bestTimeToVisit },
    { title: "weather", items: weatherInfo },
  ];

  const locations = itinerary
    ?.slice(0, 4)
    .map((item) => item.location)
    .join(", ");

  const handleGeneratePaymentLink = async () => {
    if (!tripId || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/retry-trip-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate payment link");
      }
      setPaymentLink(result.payment_link);
      // Revalidate loader to ensure fresh state across the app
      revalidator.revalidate();
    } catch (err: any) {
      console.error("Error creating payment link:", err);
      setErrorMessage("Failed to generate payment link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="travel-detail wrapper">
      <Header
        title="Travel Details"
        description="View and edit AI-generated travel plans"
      />

      <section className="wrapper-md border-light-400 container mb-6 rounded-2xl border bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="p-18-semibold text-dark-100">Payment Link Status</h2>
            <p className="text-sm text-gray-100">
              {paymentLink
                ? "This trip has an active Stripe payment link configured."
                : "No payment link found. Users will see 'Not available now' unless a payment link is added."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {paymentLink ? (
              <>
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-class-secondary inline-flex h-10 items-center justify-center px-4"
                >
                  <span className="p-14-medium cursor-pointer hover:underline">
                    View Payment Link
                  </span>
                </a>
                <ButtonComponent
                  type="button"
                  onClick={() => navigator.clipboard.writeText(paymentLink)}
                  className="button-class inline-flex h-10! items-center justify-center px-4!"
                  title="Copy Link to Clipboard"
                >
                  <span className="p-14-medium text-white">Copy Link</span>
                </ButtonComponent>
              </>
            ) : (
              <ButtonComponent
                type="button"
                disabled={isLoading}
                onClick={handleGeneratePaymentLink}
                className={cn(
                  "button-class inline-flex h-10! items-center justify-center gap-2! px-5!",
                  isLoading && "cursor-not-allowed! opacity-75!",
                )}
              >
                {isLoading ? (
                  <>
                    <img
                      src="/assets/icons/loader.svg"
                      alt="loader icon"
                      className="size-4 animate-spin"
                    />
                    <span className="p-14-medium text-white">
                      Generating...
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src="/assets/icons/plus.svg"
                      alt=""
                      aria-hidden="true"
                      className="size-4 brightness-0 invert"
                    />
                    <span className="p-14-medium text-white">Add Link</span>
                  </>
                )}
              </ButtonComponent>
            )}
          </div>
        </div>
        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
      </section>

      <section className="wrapper-md container">
        <header>
          <h1 className="p-40-semibold text-dark-100">{name}</h1>

          <div className="flex items-center gap-5">
            <InfoPill
              text={`${duration} day plan`}
              image="/assets/icons/calendar.svg"
            />
            <InfoPill
              text={locations || ""}
              image="/assets/icons/location-mark.svg"
            />
          </div>
        </header>
        <section className="gallery">
          {imageUrls.map((url: string, i) => (
            <img
              src={url}
              key={"img" + i}
              className={cn(
                "w-full rounded-xl object-cover",

                i === 0
                  ? "h-82.5 md:col-span-2 md:row-span-2"
                  : "h-37.5 md:row-span-1",
              )}
            />
          ))}
        </section>

        <section className="flex flex-wrap items-center gap-3 md:gap-5">
          <ChipListComponent id="travel-chip">
            <ChipsDirective>
              {pillItems.map((pill, i) => (
                <ChipDirective
                  key={"pill" + i}
                  text={getFirstWord(pill.text)}
                  cssClass={`bg-linear-0! border-none! ${pill.bg} text-base! font-medium! px-4!`}
                />
              ))}
            </ChipsDirective>
          </ChipListComponent>

          <ul className="flex items-center gap-1">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <li key={"star" + i}>
                  <img
                    src="/assets/icons/star.svg"
                    alt="star"
                    className="size-4.5"
                  />
                </li>
              ))}
            <li className="ml-1">
              <ChipListComponent>
                <ChipsDirective>
                  <ChipDirective
                    text="4.9/5"
                    cssClass="border-none! bg-linear-0! bg-yellow-50! text-yellow-700!"
                  />
                </ChipsDirective>
              </ChipListComponent>
            </li>
          </ul>
        </section>

        <section className="title">
          <article>
            <h3>
              {duration}-Day {country} {travelStyle} Trip
            </h3>
            <p>
              {budget}, {groupType} and {interests}
            </p>
          </article>
          <h2>{estimatedPrice}</h2>
        </section>

        <p className="text-dark-400 text-sm font-normal md:text-lg">
          {description}
        </p>

        <ul className="itinerary">
          {itinerary.map((dayPlan: DayPlan, i) => (
            <li key={"dayPlan-" + i}>
              <h3>
                Day {dayPlan.day}: {dayPlan.location}
              </h3>

              <ul>
                {dayPlan.activities.map((activity, i) => (
                  <li key={"activity-" + i}>
                    <span className="p-18-semibold shrink-0 md:pt-0.75">
                      {activity.time}
                    </span>
                    <p className="grow">{activity.description}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        {visitTimeAndWeatherInfo.map(({ title, items }) => (
          <section key={title} className="visit">
            <div>
              <h3>{title}</h3>

              <ul>
                {items?.map((item) => (
                  <li key={item}>
                    <p className="grow">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="p-24-semibold text-dark-100">Popular Trips</h2>

        <div className="trip-grid">
          {allTrips?.map(
            ({
              id,
              name,
              imageUrls,
              itinerary,
              interests,
              travelStyle,
              estimatedPrice,
            }) => (
              <TripCard
                key={id}
                id={id}
                name={name}
                imageUrl={imageUrls}
                location={itinerary?.[0]?.location ?? ""}
                tags={[interests, travelStyle]}
                price={estimatedPrice}
              />
            ),
          )}
        </div>
      </section>
    </section>
  );
};

export default TripDetails;
