import { useEffect, useState } from "react";

const ToggleButton = () => {
  // 1. Initialize state from the <html> element
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    // Sync state on initial mount
    setIsDark(document.documentElement.classList.contains("dark"));
    // 2. Listen for theme toggles triggered by any ToggleButton
    const onThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("theme-change", onThemeChange);
    return () => {
      window.removeEventListener("theme-change", onThemeChange);
    };
  }, []);

  const handleToggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    // Tell all other ToggleButtons on the page to update
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      className="theme-toggle"
      onClick={handleToggle}
    >
      {/* Moon icon — shown in light mode */}
      <svg
        className="block size-5 dark:hidden"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      {/* Sun icon — shown in dark mode */}
      <svg
        className="hidden size-5 dark:block"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41
             M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        />
      </svg>
    </button>
  );
};

export default ToggleButton;
