import { OAuthProvider, Query } from "appwrite";
import { database, appwriteConfig, account } from "./client";
import { redirect } from "react-router";

const { databaseId, userCollectionId } = appwriteConfig;

const getExistingUser = async (id: string) => {
  try {
    const { rows, total } = await database.listRows({
      databaseId,
      tableId: userCollectionId,
      queries: [Query.equal("accountId", id)],
    });

    return total > 0 ? rows[0] : null;
  } catch (e) {
    console.error("Error fetching user:", e);
    return null;
  }
};

const storeUserData = async () => {
  try {
    const user = await account.get();
    if (!user) throw new Error("User not found");

    // 1. Check if user already exists in the database
    const existing = await getExistingUser(user.$id);
    if (existing) return existing;

    // 2. Fetch profile photo if token is available
    let profilePicture: string | null = null;
    try {
      const session = await account.getSession({ sessionId: "current" });
      if (session?.providerAccessToken) {
        profilePicture = await getGooglePicture(session.providerAccessToken);
      }
    } catch (e) {
      console.error("Error fetching Google picture:", e);
    }

    // Fallback image if Google photo wasn't retrieved
    const imageUrl =
      profilePicture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}`;

    // 3. Create user in the database table
    const newUser = await database.createRow({
      databaseId,
      tableId: userCollectionId,
      rowId: user.$id,
      data: {
        accountId: user.$id,
        email: user.email,
        name: user.name,
        imageUrl,
      },
    });
    if (!newUser.$id) redirect("/sign-in");
    return newUser;
  } catch (e) {
    console.error("Error storing user data:", e);
  }
};

const getGooglePicture = async (accessToken: string) => {
  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) throw new Error("Failed to fetch Google profile picture");

    const { photos } = await response.json();
    return photos?.[0]?.url || null;
  } catch (e) {
    console.error("Error fetching Google picture:", e);
    return null;
  }
};

const loginWidthGoogle = async () => {
  try {
    account.createOAuth2Session({
      provider: OAuthProvider.Google,
      success: `${window.location.origin}/`,
      failure: `${window.location.origin}/404`,
      scopes: ["https://www.googleapis.com/auth/userinfo.profile"],
    });
  } catch (e) {
    console.error("Error during OAuth2 session creation:", e);
  }
};

const logoutUser = async () => {
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch (e) {
    console.error("Error during logout:", e);
    throw e;
  }
};

const getUser = async () => {
  try {
    const user = await account.get();
    if (!user) throw redirect("/sign-in");

    // Fetch from database, or create if first-time login
    const userDoc =
      (await getExistingUser(user.$id)) || (await storeUserData());
    if (!userDoc) throw redirect("/sign-in");

    return {
      id: userDoc.$id,
      accountId: userDoc.accountId,
      name: userDoc.name,
      email: userDoc.email,
      imageUrl: userDoc.imageUrl,
      dateJoined: userDoc.$createdAt,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

const getUsers = async (limit: number, offset: number) => {
  try {
    const { rows: users, total } = await database.listRows({
      databaseId,
      tableId: userCollectionId,
      queries: [Query.limit(limit), Query.offset(offset)],
    });

    if (total === 0) return { users: [], total };
    return { users, total };
  } catch (e) {
    console.log("Error fetching users");
    return { users: [], total: 0 };
  }
};

export {
  getExistingUser,
  storeUserData,
  getGooglePicture,
  loginWidthGoogle,
  logoutUser,
  getUser,
  getUsers,
};
