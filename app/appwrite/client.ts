import { Account, Client, Storage, TablesDB } from "appwrite";

export const appwriteConfig = {
  endpointUrl: import.meta.env.VITE_APPWRITE_API_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  userCollectionId: import.meta.env.VITE_APPWRITE_USERS_TABLE_ID,
  tripCollectionId: import.meta.env.VITE_APPWRITE_TRIPS_TABLE_ID,
};

export const client = new Client()
  .setEndpoint(appwriteConfig.endpointUrl)
  .setProject(appwriteConfig.projectId);

const account = new Account(client);
const storage = new Storage(client);
const database = new TablesDB(client);

export { account, storage, database };
