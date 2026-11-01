import { Outlet, redirect } from "react-router";
import { SidebarComponent } from "@syncfusion/ej2-react-navigations";
import { MobileSidebar, NavItems } from "../../../components";
import { account } from "../../appwrite/client";
import { getExistingUser, storeUserData } from "../../appwrite/auth";

export const clientLoader = async () => {
  try {
    const user = await account.get();
    if (!user) return redirect("/sign-in");

    // 1. Get existing or create new
    const existingUser = await getExistingUser(user.$id);
    const userDoc = existingUser?.$id ? existingUser : await storeUserData();

    // 2. Safely check if userDoc exists
    if (!userDoc) {
      return redirect("/sign-in");
    }

    // 3. Check role/status (using safe optional chaining or casting)
    if ((userDoc as unknown as UserData)?.status !== "admin") {
      return redirect("/");
    }

    return userDoc;
  } catch (error) {
    console.error("Auth check failed:", error);
    return redirect("/sign-in");
  }
};
const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <MobileSidebar />
      <aside className="hidden w-full max-w-67.5 lg:block">
        <SidebarComponent width={270} enableGestures={false}>
          <NavItems />
        </SidebarComponent>
      </aside>
      <aside className="children">
        <Outlet />
      </aside>
    </div>
  );
};

export default AdminLayout;
