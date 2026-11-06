import { Link, redirect, type LoaderFunctionArgs } from "react-router";
import { getAllTrips, getTripById } from "../../appwrite/trip";
import { cn, getFirstWord, parseTripData } from "../../lib/utils";
import type { Route } from "./+types/travel-detail";
import { Line } from "@syncfusion/ej2-react-maps";
import { InfoPill, TripCard } from "../../../components";
import {
  ButtonComponent,
  ChipDirective,
  ChipListComponent,
  ChipsDirective,
} from "@syncfusion/ej2-react-buttons";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { tripId } = params;
  if (!tripId) {
    console.log("Trip ID is required");
    throw redirect("/");
  }

  const [trip, trips] = await Promise.all([
    getTripById(tripId),
    getAllTrips(4, 0),
  ]);

  return {
    trip,
    allTrips: trips.allTrips.flatMap(({ $id, tripDetails, imageUrls }) => {
      const parsed = parseTripData(tripDetails);

      return parsed ? { ...parsed, $id, imageUrls: imageUrls ?? [] } : [];
    }),
  };
};

const TravelDetail = ({ loaderData }: Route.ComponentProps) => {
  const trip = loaderData?.trip;
  const imageUrls = trip?.imageUrls;
  const tripData = parseTripData(trip?.tripDetails);
  const paymentLink = trip?.payment_link;

  const {
    name,
    duration,
    itinerary,
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
  const allTrips = loaderData.allTrips as Trip[] | [];

  const pillItems = [
    { text: travelStyle, bg: "bg-pink-50! text-pink-500!" },
    { text: groupType, bg: "bg-primary-50! text-primary-500!" },
    { text: budget, bg: "bg-success-50! text-success-700!" },
    { text: interests, bg: "bg-navy-50! text-navy-500!" },
  ];

  const visitTimeAndWeatherInfo = [
    { title: "Best Time to Visit:", items: bestTimeToVisit },
    { title: "Weather:", items: weatherInfo },
  ];

  return (
    <main className="travel-detail wrapper pt-40">
      <div className="travel-div">
        <Link to="/" className="back-link">
          <img src="/assets/icons/arrow-left.svg" alt="back icon" />
          <span>Go Back</span>
        </Link>

        <section className="wrapper-md container">
          <header>
            <h1 className="p-40-semibold text-dark-100">{name}</h1>
            <div className="flex items-center gap-5">
              <InfoPill
                text={`${duration} day plan`}
                image="/assets/icons/calendar.svg"
              />
              <InfoPill
                text={
                  itinerary
                    .slice(0, 4)
                    .map((i) => i.location)
                    .join(", ") || ""
                }
                image="/assets/icons/location-mark.svg"
              />
            </div>
          </header>

          <section className="gallery">
            {imageUrls?.map((url: string, i) => (
              <img
                key={"imag-" + i}
                src={url}
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
                {pillItems.map(({ text, bg }, i) => (
                  <ChipDirective
                    key={"pill-" + i}
                    text={getFirstWord(text)}
                    cssClass={`bg-linear-0! border-none! ${bg} text-base! font-medium! px-4!`}
                  />
                ))}
              </ChipsDirective>
            </ChipListComponent>

            <ul className="flex items-center gap-1">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <li key={"star-" + i}>
                    <img
                      src="/assets/icons/star.svg"
                      alt=""
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
            {itinerary.map(({ day, location, activities }: DayPlan, i) => (
              <li key={"dayPlan-" + i}>
                <h3>
                  Day {day} : {location}
                </h3>
                <ul>
                  {activities.map(({ time, description }, i) => (
                    <li key={"activity-" + i}>
                      <span className="p-18-semibold shrink-0 md:pt-0.75">
                        {time}
                      </span>
                      <p className="grow">{description}</p>
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
                  {items.map((item) => (
                    <li key={item} className="grow">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <a href={paymentLink} className="flex">
            <span className="button-class relative py-4">
              <span className="p-16-semibold text-white">
                Pay to join the trip
              </span>
              <span className="price-pill">{estimatedPrice}</span>
              {!paymentLink && (
                <span className="absolute -inset-4 z-2 flex cursor-not-allowed items-center justify-center rounded-xl bg-black/30 text-2xl font-extrabold text-white">
                  Not available now
                </span>
              )}
            </span>
          </a>
        </section>
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="p-24-semibold text-dark-100">Popular Trips</h2>

        <div className="trip-grid">
          {allTrips.map(
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
                id={id}
                key={id}
                name={name}
                imageUrl={imageUrls[0]}
                location={itinerary?.[0]?.location ?? ""}
                tags={[interests, travelStyle]}
                price={estimatedPrice}
              />
            ),
          )}
        </div>
      </section>
    </main>
  );
};

export default TravelDetail;
