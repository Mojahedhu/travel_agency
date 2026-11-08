import { Link, type LoaderFunctionArgs } from "react-router";

import { getAllTrips } from "../../appwrite/trip";
import { parseTripData } from "../../lib/utils";
import type { Route } from "./+types/travel-page";
import { useState } from "react";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { FeaturedDestination, Header, TripCard } from "../../../components";
import { PagerComponent } from "@syncfusion/ej2-react-grids";

const destinationList = [
  {
    bgImage: "bg-card-2",
    containerClass: "",

    title: "London",
    rating: 4.5,
    activityCount: 512,
  },
  {
    bgImage: "bg-card-3",
    containerClass: "",
    title: "Australia Tour",
    rating: 3.5,
    activityCount: 250,
  },
  {
    containerClass: "w-full h-[240px]",
    bgImage: "bg-card-4",
    title: "Spain Tour",
    rating: 3.8,
    activityCount: 150,
  },
  {
    containerClass: "w-full h-[240px]",
    bgImage: "bg-card-5",
    title: "Japan",
    rating: 5,
    activityCount: 150,
  },
  {
    containerClass: "w-full h-[240px]",
    bgImage: "bg-card-6",
    title: "Italy Tour",
    rating: 4.2,
    activityCount: 500,
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const limit = 8;
  const url = new URL(request.url);
  const parsedPage = parseInt(url.searchParams.get("page") || "1", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const offset = (page - 1) * limit;

  // const [user, {allTrips, total}] = await Promise.all([
  //   getUser(),
  //   getAllTrips(limit, offset)
  // ])
  const { allTrips, total } = await getAllTrips(limit, offset);

  return {
    trips: allTrips.flatMap(({ $id, tripDetails, imageUrls }) => {
      const parsed = parseTripData(tripDetails);
      return parsed ? { ...parsed, id: $id, imageUrls: imageUrls || [] } : [];
    }),
    total,
    page,
  };
};

const TravelPage = ({ loaderData }: Route.ComponentProps) => {
  const { trips, page, total } = loaderData;

  const [currentPage, setCurrentPage] = useState(page);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.location.search = `?page=${page}`;
  };

  return (
    <main className="flex flex-col scroll-smooth">
      <section className="travel-hero">
        <div>
          <section className="wrapper">
            <article>
              <h1 className="p-72-bold text-[#1f1f36]">
                Plan Your Trip with Ease
              </h1>

              <p className="text-[#1f1f36]">
                Customize your travel itinerary in minutes-pick your
                destination, set your preferences, and explore with confidence.
              </p>
            </article>
            <Link to={"#trips"}>
              <ButtonComponent
                type="button"
                className="button-class h-14! w-full! md:w-60!"
              >
                <span className="p-16-semibold text-white">Get Started</span>
              </ButtonComponent>
            </Link>
          </section>
        </div>
      </section>

      <section className="wrapper flex h-full flex-col pt-20">
        <Header
          title="Featured Travel Destination"
          description="Check out some of the best places you can visit around the world"
        />
        <div className="featured">
          <article>
            <FeaturedDestination
              bgImage="bg-card-1"
              containerClass="h-1/3 lg:h-1/2"
              bigCard
              title="Barcelona Tour"
              rating={4.2}
              activityCount={196}
            />
            <div className="travel-featured">
              {destinationList
                .slice(0, 2)
                .map(({ bgImage, title, rating, activityCount }) => (
                  <FeaturedDestination
                    key={title}
                    bgImage={bgImage}
                    bigCard
                    title={title}
                    rating={rating}
                    activityCount={activityCount}
                  />
                ))}
            </div>
          </article>
          <div className="flex flex-col gap-7.5">
            {destinationList
              .slice(2)
              .map(
                ({ containerClass, bgImage, title, rating, activityCount }) => (
                  <FeaturedDestination
                    key={title}
                    containerClass={containerClass}
                    bgImage={bgImage}
                    title={title}
                    rating={rating}
                    activityCount={activityCount}
                  />
                ),
              )}
          </div>
        </div>
      </section>

      <section id="trips" className="wrapper flex flex-col gap-10 py-20">
        <Header
          title="Handpicked Trips"
          description="Browse well-planed trips designed for you travel style"
        />

        <div className="trip-grid">
          {(trips as Trip[])?.map(
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
                imageUrl={imageUrls[0]}
                location={itinerary?.[0]?.location ?? ""}
                tags={[interests, travelStyle]}
                price={estimatedPrice}
              />
            ),
          )}
        </div>
        <PagerComponent
          totalRecordsCount={total}
          currentPage={currentPage}
          pageSize={8}
          click={(args) => {
            handlePageChange(args.currentPage);
          }}
          cssClass="mb-4!"
        />
      </section>

      <footer className="h-28 bg-white">
        <div className="wrapper footer-container">
          <Link to={"/"}>
            <img src="/assets/icons/logo.svg" alt="logo" className="size-7.5" />
            <h1>Worldvisto</h1>
          </Link>

          <div>
            {["Terms & Conditions", "Privacy Policy"].map((item) => (
              <Link to="/" key={item} className="hover:underline">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
};

export default TravelPage;
