import { Link } from "react-router";
import NavItems from "./NavItems";
import { useRef } from "react";
import { SidebarComponent } from "@syncfusion/ej2-react-navigations";

const MobileSidebar = () => {
  const sidebarRef = useRef<SidebarComponent>(null);

  const toggleSidebar = () => {
    sidebarRef.current?.toggle();
  };
  return (
    <div className="mobile-sidebar wrapper">
      <header>
        <Link to={"/"}>
          <img src="/assets/icons/logo.svg" alt="logo" className="size-7.5" />
          <h1>Worldvisto</h1>
        </Link>

        <button onClick={toggleSidebar} aria-label="Open navigation">
          <img src="/assets/icons/menu.svg" className="size-7" alt="menu" />
        </button>
      </header>

      <SidebarComponent
        ref={sidebarRef}
        closeOnDocumentClick
        showBackdrop
        width={270}
        type={"Over"}
      >
        <NavItems handleClick={toggleSidebar} />
      </SidebarComponent>
    </div>
  );
};

export default MobileSidebar;
