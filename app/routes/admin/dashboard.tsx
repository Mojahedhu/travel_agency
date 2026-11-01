import { Header, StatsCard, TripCard } from "../../../components";
import { getUser } from "../../appwrite/auth";
import { allTrips, dashboardStats } from "../../constants";
import type { Route } from "./+types/admin-layout";

const { totalUsers, usersJoined, totalTrips, tripsCreated, userRole } =
  dashboardStats;

export const clientLoader = async () => {
  const user = await getUser();
  return user;
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const user = loaderData as unknown as User | null;

  return (
    <main className="dashboard wrapper">
      <Header
        title={`${user?.name ?? "Guest"} 👋`}
        description="Track activity, trends and popular destination in real time"
      />
      <section className="flex flex-col gap-6">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <StatsCard
            headerTitle="Total Users"
            total={totalUsers}
            currentMonthCount={usersJoined.currentMonth}
            lastMonthCount={usersJoined.lastMonth}
          />
          <StatsCard
            headerTitle="Total Trips"
            total={totalTrips}
            currentMonthCount={tripsCreated.currentMoth}
            lastMonthCount={tripsCreated.lastMonth}
          />
          <StatsCard
            headerTitle="Active Users"
            total={userRole.total}
            currentMonthCount={userRole.currentMoth}
            lastMonthCount={userRole.lastMonth}
          />
        </div>
      </section>

      <section className="trip-grid">
        {allTrips.map(
          ({ id, name, imageUrls, itinerary, tags, estimatedPrice }) => (
            <TripCard
              key={"trip" + id}
              id={id.toString()}
              name={name}
              imageUrl={imageUrls[0]}
              location={itinerary?.[0]?.location ?? ""}
              tags={tags}
              price={estimatedPrice}
            />
          ),
        )}
      </section>
    </main>
  );
};

export default Dashboard;
