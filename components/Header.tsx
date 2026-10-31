import { useLocation } from "react-router";
import { cn } from "../app/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
}

const Header = ({ title, description }: HeaderProps) => {
  const location = useLocation();
  return (
    <header className="header">
      <article>
        <h1
          className={cn(
            "text-dark-100",
            location.pathname === "/"
              ? "text-2xl text-4xl font-bold"
              : "text-xl font-semibold md:text-2xl",
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-lg font-normal text-gray-100",
            location.pathname === "/" ? "text-base" : "text-sm",
          )}
        >
          {description}
        </p>
      </article>
    </header>
  );
};

export default Header;
