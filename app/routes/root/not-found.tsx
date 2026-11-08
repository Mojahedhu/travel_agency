import {
  Link,
  useNavigate,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
/**
 * NotFound – custom 404 / error page
 *
 * React Router v7 best-practice:
 *  - Export `ErrorBoundary` so the framework mounts it automatically when any
 *    loader/action under this route throws a Response with status 404 (or any
 *    other unhandled error).
 *  - `useRouteError()` gives us the actual error object so we can distinguish
 *    404s from unexpected runtime errors and render different copy.
 *
 */

export function loader() {
  throw new Response(null, { status: 404 });
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const handleGoBack = () => {
    // In React Router / standard HTML5 history, idx > 0 indicates a previous entry in this session
    try {
      navigate(-1);
    } catch (error) {
      console.log("Fallback");
      // Fallback to the established home route
      navigate("/", { replace: true });
    }
  };

  /* ── derive human-readable copy from the error ───────────────────── */
  const is404 = !error || (isRouteErrorResponse(error) && error.status === 404);

  const statusCode = isRouteErrorResponse(error)
    ? error.status
    : error
      ? 500
      : 404;

  const headline = is404 ? "404" : String(statusCode);

  const title = is404 ? "Lost in Paradise?" : "Something Went Wrong";

  const description = is404
    ? "Looks like this destination doesn't exist on our map — yet. Let's get you back to somewhere beautiful."
    : "An unexpected error occurred on our end. Our crew is already on it. Head back home while we sort things out.";

  return (
    <main
      className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      aria-labelledby="error-heading"
    >
      {/* ── Full-screen background image ──────────────────────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/images/sample1.jpg')" }}
        aria-hidden="true"
      />

      {/* ── Dark overlay so text stays legible ───────────────────────── */}
      <div
        className="absolute inset-0 bg-[#141627]/60 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* ── Glass card ───────────────────────────────────────────────── */}
      <article className="shadow-200 rounded-20 relative z-10 mx-4 flex w-full max-w-lg flex-col items-center gap-8 border border-white/20 bg-white/10 px-8 py-12 backdrop-blur-md sm:px-12">
        {/* Logo */}
        <Link
          to="/"
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
        </Link>

        {/* Big error code */}
        <p
          id="error-heading"
          className="p-72-bold bg-linear-to-br from-white via-white/80 to-white/40 bg-clip-text text-transparent drop-shadow-lg"
          aria-label={`Error ${headline}`}
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
          <button
            type="button"
            onClick={handleGoBack}
            className="button-class-secondary text-dark-100 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/90 px-6 font-semibold shadow-sm transition hover:bg-white"
          >
            <img
              src="/assets/icons/arrow-left.svg"
              alt=""
              aria-hidden="true"
              className="size-4 dark:invert"
            />
            <span className="p-16-semibold">Go Back</span>
          </button>

          <Link
            to="/"
            replace
            className="button-class flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 transition"
          >
            <img
              src="/assets/icons/home.svg"
              alt=""
              aria-hidden="true"
              className="size-4 invert"
            />
            <span className="p-16-semibold text-white">Back to Home</span>
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-white/50">
          Error&nbsp;{statusCode}&nbsp;·&nbsp;Worldvisto Travel Agency
        </p>
      </article>
    </main>
  );
}

/**
 * Default export – this route has no UI of its own; it only exists to host
 * the ErrorBoundary so React Router can render it for unmatched paths.
 * We re-use the ErrorBoundary component here as well, keeping things DRY.
 */
export default function NotFound() {
  return <ErrorBoundary />;
}
