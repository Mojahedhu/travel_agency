import * as Sentry from "@sentry/react-router";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { registerLicense } from "@syncfusion/ej2-base";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

polyfillCountryFlagEmojis();

registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY);

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <script
          dangerouslySetInnerHTML={{
            __html: `
                (function(){
                  try {
                       let s = null;
                    try {
                      s = localStorage.getItem('theme');
                    } catch(e){}
                    let p = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (s === 'dark' || (!s && p)) document.documentElement.classList.add('dark');
                  } catch(e){}
                })();
              `,
          }}
        />
        <Links />
        <title>Worldvisto</title>
        <link rel="icon" type="image/svg" href="/favicon.svg" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // Capture unexpected (non-routing) errors with Sentry
  if (!isRouteErrorResponse(error)) {
    Sentry.captureException(error);
  }

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      history.back();
    } catch {
      window.location.href = "/";
    }
  };

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const statusCode = isRouteErrorResponse(error) ? error.status : 500;
  const headline = is404 ? "404" : String(statusCode);
  const title = is404 ? "Lost in Paradise?" : "Something Went Wrong";
  const description = is404
    ? "Looks like this destination doesn't exist on our map — yet. Let's get you back to somewhere beautiful."
    : "An unexpected error occurred on our end. Our crew is already on it. Head back home while we sort things out.";

  // In dev, surface runtime error details below the card
  const devStack =
    import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      aria-labelledby="root-error-heading"
    >
      {/* Full-screen background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/images/sample1.jpg')" }}
        aria-hidden="true"
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-[#141627]/60 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* Glass card */}
      <article className="shadow-200 relative z-10 mx-4 flex w-full max-w-lg flex-col items-center gap-8 rounded-[20px] border border-white/20 bg-white/10 px-8 py-12 backdrop-blur-md sm:px-12">
        {/* Logo — plain <a> so it works even when the React Router context is broken */}
        <a
          href="/"
          className="flex items-center gap-2 self-start"
          aria-label="Worldvisto – go home"
        >
          <img
            src="/assets/icons/logo.svg"
            alt=""
            aria-hidden="true"
            className="size-7"
          />
          <span className="text-base font-bold text-white md:text-xl">
            Worldvisto
          </span>
        </a>

        {/* Big error code */}
        <p
          id="root-error-heading"
          className="p-72-bold bg-linear-to-br from-white via-white/80 to-white/40 bg-clip-text text-transparent drop-shadow-lg"
        >
          {headline}
        </p>

        {/* Title & description */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="p-28-bold text-white">{title}</h1>
          <p className="text-sm font-normal text-white/80 md:text-base">
            {description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            onClick={handleGoBack}
            className="text-dark-100 bg-surface/90 hover:bg-surface flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-6 font-semibold shadow-sm transition"
          >
            <img
              src="/assets/icons/arrow-left.svg"
              alt=""
              aria-hidden="true"
              className="text-dark-100 size-4 dark:invert"
            />
            <span className="p-16-semibold">Go Back</span>
          </a>

          <a
            href="/"
            className="button-class flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 transition"
          >
            <img
              src="/assets/icons/home.svg"
              alt=""
              aria-hidden="true"
              className="size-4 invert"
            />
            <span className="p-16-semibold text-white">Back to Home</span>
          </a>
        </div>

        <p className="text-xs text-white/50">
          Error&nbsp;{statusCode}&nbsp;·&nbsp;Worldvisto Travel Agency
        </p>
      </article>

      {/* Dev-only stack trace */}
      {devStack && (
        <pre className="absolute right-4 bottom-4 left-4 max-h-48 overflow-auto rounded-xl bg-black/70 p-4 text-xs text-red-300">
          {devStack}
        </pre>
      )}
    </main>
  );
}
