import { Outlet, redirect } from "react-router";
import { account } from "../../appwrite/client";
import { getExistingUser } from "../../appwrite/auth";
import { RootNavbar } from "../../../components";

export const clientLoader = async () => {
  try {
    const user = await account.get();
    if (!user) return redirect("/sign-in");

    return await getExistingUser(user.$id);
  } catch (error) {
    console.log("Error fetching user: ", error);
    throw redirect("/sign-in");
  }
};

const PageLayout = () => {
  return (
    <div className="bg-light-200">
      <RootNavbar />
      <Outlet />
    </div>
  );
};

export default PageLayout;
