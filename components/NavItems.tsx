import { Link, NavLink, useLoaderData, useNavigate } from "react-router";
import { sidebarItems } from "../app/constants";
import { cn } from "../app/lib/utils";
import clsx from "clsx";
import { logoutUser } from "../app/appwrite/auth";

type Active = {
  isActive: boolean;
};

interface NavItemsProps {
  handleClick?: () => void;
}

const NavItems = ({ handleClick }: NavItemsProps) => {
  const user = useLoaderData() as User;

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/sign-in");
  };

  return (
    <section className="nav-items">
      <Link to={"/"} className="link-logo">
        <img src="/assets/icons/logo.svg" alt="logo" className="size-7.5" />
        <h1>Worldvisto</h1>
      </Link>
      <div className="container">
        <nav>
          {sidebarItems.map(({ id, href, icon, label }) => (
            <NavLink key={"like" + id} to={href} onClick={handleClick}>
              {({ isActive }: Active) => (
                <div
                  className={cn("group nav-item", {
                    "bg-primary-100 text-white!": isActive,
                  })}
                >
                  <img
                    src={icon}
                    alt={label}
                    className={clsx(
                      "size-0 group-hover:brightness-0 group-hover:invert",
                      isActive ? "brightness-0 invert" : "text-dark-200",
                    )}
                  />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <footer className="nav-footer">
          <img
            src={user?.imageUrl || "/assets/icons/logo.svg"}
            alt={user?.name || "profile image"}
            referrerPolicy="no-referrer"
          />

          <article>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </article>
          <button
            className="group hover:bg-primary-100 cursor-pointer rounded px-2 py-1.5"
            onClick={handleLogout}
          >
            <img
              src="/assets/icons/logout.svg"
              alt="logout"
              className="size-6 group-hover:brightness-0 group-hover:invert"
            />
          </button>
        </footer>
      </div>
    </section>
  );
};

export default NavItems;
