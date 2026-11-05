import { parseTripData } from "../lib/utils";
import { appwriteConfig, database } from "./client";

interface Document {
  [key: string]: any;
}

type FilterByDate = (
  items: Document[],
  key: string,
  start: string,
  end?: string,
) => number;

const { databaseId, userCollectionId, tripCollectionId } = appwriteConfig;

export const getUsersAndTripsStat = async (): Promise<DashboardStats> => {
  const d = new Date();
  const startCurrent = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  const prevStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  const prevEnd = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();

  const [users, trips] = await Promise.all([
    database.listRows({
      databaseId,
      tableId: userCollectionId,
    }),
    database.listRows({
      databaseId,
      tableId: tripCollectionId,
    }),
  ]);

  const filteredByDate: FilterByDate = (items, key, start, end) =>
    items.filter((item) => item[key] >= start && (!end || item[key] <= end))
      .length;

  const filterUserByRole = (role: string) =>
    users.rows.filter((u: Document) => u.status === role);

  const tripCountsByUserId = trips.rows.reduce(
    (acc: Record<string, number>, trip: Document) => {
      const userId = trip.userId;
      if (userId) {
        acc[userId] = (acc[userId] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  return {
    totalUsers: users.total,
    usersJoined: {
      currentMonth: filteredByDate(
        users.rows,
        "$createdAt",
        startCurrent,
        undefined,
      ),
      lastMonth: filteredByDate(users.rows, "$createdAt", prevStart, prevEnd),
    },
    userRole: {
      total: filterUserByRole("user").length,
      currentMonth: filteredByDate(
        filterUserByRole("user"),
        "$createdAt",
        startCurrent,
        undefined,
      ),
      lastMonth: filteredByDate(
        filterUserByRole("user"),
        "$createdAt",
        prevStart,
        prevEnd,
      ),
    },
    totalTrips: trips.total,
    tripsCreated: {
      currentMonth: filteredByDate(
        trips.rows,
        "$createdAt",

        startCurrent,
        undefined,
      ),
      lastMonth: filteredByDate(trips.rows, "$createdAt", prevStart, prevEnd),
    },
    userTripCounts: users.rows.map((user: Record<string, string>) => {
      const userId: string = user.accountId || user.$id;
      const count =
        tripCountsByUserId[userId] || tripCountsByUserId[user.$id] || 0;

      return {
        [userId]: {
          name: user.name || "Unknown",
          count,
        },
      };
    }),
  };
};

export const getUserGrowthPerDay = async () => {
  const users = await database.listRows({
    databaseId,
    tableId: userCollectionId,
  });

  const userGrowth = users.rows.reduce(
    (acc: Record<string, number>, user: Document) => {
      const data = new Date(user.$createdAt);
      const day = data.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {},
  );

  return Object.entries(userGrowth).map(([day, count]) => ({
    count: Number(count),
    day,
  }));
};

export const getTripsCreatedPerDay = async () => {
  const trips = await database.listRows({
    databaseId,
    tableId: tripCollectionId,
  });

  const tripGrowth = trips.rows.reduce(
    (acc: Record<string, number>, trip: Document) => {
      const date = new Date(trip.$createdAt);
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {},
  );

  return Object.entries(tripGrowth).map(([day, count]) => ({
    count: Number(count),
    day,
  }));
};

export const getTripsByTravelStyle = async () => {
  const trips = await database.listRows({
    databaseId,
    tableId: tripCollectionId,
  });

  const travelStyleCount = trips.rows.reduce(
    (acc: Record<string, number>, trip: Document) => {
      const tripDetail = parseTripData(trip.tripDetails);
      if (tripDetail && tripDetail.travelStyle) {
        const { travelStyle } = tripDetail;
        acc[travelStyle] = (acc[travelStyle] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  return Object.entries(travelStyleCount).map(([travelStyle, count]) => ({
    count: Number(count),
    travelStyle,
  }));
};

// export const getUserTripCounts = async () => {
//   const [users, trips] = await Promise.all([
//     database.listRows({
//       databaseId,
//       tableId: userCollectionId,
//     }),
//     database.listRows({
//       databaseId,
//       tableId: tripCollectionId,
//     }),
//   ]);

//   const tripCountsByUserId = trips.rows.reduce(
//     (acc: Record<string, number>, trip: Document) => {
//       const userId = trip.userId;
//       if (userId) {
//         acc[userId] = (acc[userId] || 0) + 1;
//       }
//       return acc;
//     },
//     {},
//   );

//   return users.rows.map((user: Document) => {
//     const userId = user.accountId || user.$id;
//     const count =
//       tripCountsByUserId[userId] || tripCountsByUserId[user.$id] || 0;

//     return {
//       [userId]: {
//         name: user.name || "Unknown",
//         count,
//       },
//     };
//   });
// };
