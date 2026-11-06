import { Outlet, redirect } from "react-router";

import { RootNavbar } from "../../../components";
import { getUser } from "../../appwrite/auth";

export const clientLoader = async () => {
  try {
    const user = await getUser();
    if (!user) return redirect("/sign-in");

    return user;
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
