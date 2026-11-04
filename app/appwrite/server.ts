import { Account, Client, TablesDB } from "appwrite";
import { appwriteConfig } from "./client";

const { projectId, endpointUrl } = appwriteConfig;

export async function createSessionClient(request: Request) {
  const client = new Client().setEndpoint(endpointUrl).setProject(projectId);
  const account = new Account(client);
  const database = new TablesDB(client);
  // 1. Check for Authorization header (Bearer <JWT>)
  const authHeader = request.headers.get("Authorization");
  const jwt = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (jwt) {
    client.setJWT(jwt);
  } else {
    // 2. Fallback to session cookie if present
    const cookieHeader = request.headers.get("Cookie");
    const sessionToken =
      cookieHeader?.match(
        new RegExp(`(?:^|;\\s*)a_session_${projectId}=([^;]*)`),
      )?.[1] ||
      cookieHeader?.match(
        new RegExp(`(?:^|;\\s*)a_session_${projectId}_legacy=([^;]*)`),
      )?.[1];
    if (sessionToken) {
      try {
        client.setSession(decodeURIComponent(sessionToken));
      } catch {
        return { account: null, database: null, user: null };
      }
    } else {
      return { account: null, database: null, user: null };
    }
  }

  try {
    const user = await account.get();
    return { account, database, user };
  } catch (error) {
    console.error("Appwrite server authentication error:", error);
    return { account: null, database: null, user: null };
  }
}
