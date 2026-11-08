import { Link, useLocation } from "react-router";
import { cn } from "../app/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
}

const Header = ({ title, description, ctaText, ctaUrl }: HeaderProps) => {
  const location = useLocation();
  return (
    <header className="header">
      <article>
        <h1
          className={cn(
            "text-dark-100",
            location.pathname === "/"
              ? "text-2xl font-bold md:text-4xl"
              : "text-xl font-semibold md:text-2xl",
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-lg font-normal text-gray-100",
            location.pathname === "/"
              ? "text-base md:text-lg"
              : "text-sm md:text-lg",
          )}
        >
          {description}
        </p>
      </article>

      {ctaText && ctaUrl && (
        <Link
          to={ctaUrl}
          className="button-class flex h-11 w-full items-center justify-center gap-2 md:w-60"
        >
          <img
            src="/assets/icons/plus.svg"
            alt=""
            aria-hidden="true"
            className="size-5"
          />
          <span className="p-16-semibold text-white">{ctaText}</span>
        </Link>
      )}
    </header>
  );
};

export default Header;
