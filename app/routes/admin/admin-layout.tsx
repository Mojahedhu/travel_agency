import { Outlet } from "react-router";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      Mobile sidebar
      <aside className="hidden w-full max-w-67.5 lg:block">sidebar</aside>
      <aside className="children">
        <Outlet />
      </aside>
    </div>
  );
};

export default AdminLayout;
