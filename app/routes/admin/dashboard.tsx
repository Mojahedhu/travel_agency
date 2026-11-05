import { useRouteLoaderData } from "react-router";
import { Header, StatsCard, TripCard } from "../../../components";
import { tripXAxis, tripyAxis, userXAxis, useryAxis } from "../../constants";
import {
  getTripsByTravelStyle,
  getUserGrowthPerDay,
  getUsersAndTripsStat,
} from "../../appwrite/dashboard";
import { getAllTrips } from "../../appwrite/trip";
import { getAllUsers } from "../../appwrite/auth";
import { parseTripData } from "../../lib/utils";
import type { Route } from "./+types/dashboard";
import {
  Category,
  ChartComponent,
  ColumnSeries,
  DataLabel,
  Inject,
  Legend,
  SeriesCollectionDirective,
  SeriesDirective,
  SplineAreaSeries,
  Tooltip,
} from "@syncfusion/ej2-react-charts";
import {
  GridComponent,
  ColumnDirective,
  ColumnsDirective,
} from "@syncfusion/ej2-react-grids";

// const { totalUsers, usersJoined, totalTrips, tripsCreated, userRole } =
//   dashboardStats;

export const clientLoader = async () => {
  const [dashboardStats, trips, userGrowth, tripsByTravelStyle, allUsers] =
    await Promise.all([
      getUsersAndTripsStat(),
      getAllTrips(4, 0),
      getUserGrowthPerDay(),
      getTripsByTravelStyle(),
      getAllUsers(4, 0),
    ]);

  const allTrips = trips.allTrips.map(({ $id, tripDetails, imageUrls }) => {
    const parsed = parseTripData(tripDetails);
    return parsed
      ? {
          ...parseTripData(tripDetails),
          id: $id,
          imageUrls: imageUrls ?? [],
        }
      : [];
  });

  const mappedUsers: UsersItineraryCount[] = allUsers.users.map(
    ({ imageUrl, name, $id, accountId }) => {
      const userTrip = dashboardStats.userTripCounts.find(
        (u) => $id in u || (accountId && accountId in u),
      );

      const key = userTrip && ($id in userTrip ? $id : accountId);

      return {
        imageUrl,
        name,
        count: (key && userTrip?.[key]?.count) || 0,
      };
    },
  );

  return {
    dashboardStats,
    allTrips,
    userGrowth,
    tripsByTravelStyle,
    allUsers: mappedUsers,
  };
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const user = useRouteLoaderData("routes/admin/admin-layout") as
    | UserData
    | undefined;

  const { dashboardStats, allTrips, userGrowth, tripsByTravelStyle, allUsers } =
    loaderData;
  const { totalUsers, usersJoined, totalTrips, tripsCreated, userRole } =
    dashboardStats;

  const trips = (allTrips as Trip[])?.map(({ imageUrls, interests, name }) => ({
    imageUrl: imageUrls[0],
    name,
    interest: interests,
  }));

  const usersAndTrips = [
    {
      title: "Latest users signup",
      dataSource: allUsers,
      field: "count",
      headerText: "Trips created",
    },
    {
      title: "Trips based on interests",
      dataSource: trips,
      field: "interest",
      headerText: "Interests",
    },
  ];

  return (
    <main className="dashboard wrapper">
      <Header
        title={`${user?.name ?? "Admin"} 👋`}
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
            currentMonthCount={tripsCreated.currentMonth}
            lastMonthCount={tripsCreated.lastMonth}
          />
          <StatsCard
            headerTitle="Active Users"
            total={userRole.total}
            currentMonthCount={userRole.currentMonth}
            lastMonthCount={userRole.lastMonth}
          />
        </div>
      </section>

      <section className="trip-grid">
        {(allTrips as Trip[])?.map(
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
              key={"trip" + id}
              id={id.toString()}
              name={name}
              imageUrl={imageUrls[0]}
              location={itinerary?.[0]?.location ?? ""}
              tags={[interests, travelStyle]}
              price={estimatedPrice}
            />
          ),
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartComponent
          id="chart-1"
          primaryXAxis={userXAxis}
          primaryYAxis={useryAxis}
          title="User Growth"
          tooltip={{ enable: true }}
        >
          <Inject
            services={[
              ColumnSeries,
              SplineAreaSeries,
              Category,
              DataLabel,
              Tooltip,
              Legend,
            ]}
          />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={userGrowth}
              xName="day"
              yName="count"
              type="Column"
              name="Column"
              columnWidth={0.3}
              cornerRadius={{ topLeft: 10, topRight: 10 }}
            />
            <SeriesDirective
              dataSource={userGrowth}
              xName="day"
              yName="count"
              type="SplineArea"
              name="Wave"
              fill="rgba(71, 132, 238, 0.3)"
              border={{ width: 2, color: "#4784EE" }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>
        <ChartComponent
          id="chart-2"
          primaryXAxis={tripXAxis}
          primaryYAxis={tripyAxis}
          tooltip={{ enable: true }}
        >
          <Inject
            services={[
              ColumnSeries,
              SplineAreaSeries,
              Category,
              DataLabel,
              Tooltip,
              Legend,
            ]}
          />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={tripsByTravelStyle}
              xName="travelStyle"
              yName="count"
              type="Column"
              name="day"
              columnWidth={0.3}
              cornerRadius={{ topLeft: 10, topRight: 10 }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>
      </section>

      <section className="user-trip wrapper">
        {usersAndTrips.map(({ title, dataSource, headerText, field }) => (
          <div key={title} className="flex flex-col gap-5">
            <h3 className="p-20-semibold text-dark-100">{title}</h3>

            <GridComponent dataSource={dataSource} gridLines="None">
              <ColumnsDirective>
                <ColumnDirective
                  field="name"
                  headerText="Name"
                  width={200}
                  textAlign="Left"
                  template={(props: UserData) => (
                    <div className="flex items-center gap-1.5 px-4">
                      <img
                        src={props.imageUrl}
                        alt="user"
                        className="aspect-square size-8 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                      <span>{props.name}</span>
                    </div>
                  )}
                />
                <ColumnDirective
                  field={field}
                  headerText={headerText}
                  width={150}
                  textAlign="Left"
                />
              </ColumnsDirective>
            </GridComponent>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Dashboard;
