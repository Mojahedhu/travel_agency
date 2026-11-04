import { AppwriteException, Query } from "appwrite";
import { appwriteConfig, database } from "./client";

const { databaseId, tripCollectionId } = appwriteConfig;
export const getAllTrips = async (limit: number, offset: number) => {
  const allTrips = await database.listRows({
    databaseId,
    tableId: tripCollectionId,
    queries: [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
    ],
  });

  if (allTrips.total === 0) {
    console.error("No trip found");
    return { allTrips: [], total: 0 };
  }
  return { allTrips: allTrips.rows, total: allTrips.total };
};

export const getTripById = async (tripId: string) => {
  try {
    return await database.getRow({
      databaseId,
      tableId: tripCollectionId,
      rowId: tripId,
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }
    throw error;
  }
};
