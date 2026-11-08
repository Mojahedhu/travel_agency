import { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import {
  sentryReactRouter,
  type SentryReactRouterBuildOptions,
} from "@sentry/react-router/vite";

// https://vite.dev/config/
export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd(), "");

  const sentryConfig: SentryReactRouterBuildOptions = {
    org: "mh-dev",
    project: "travel_agency",
    // An auth token is required for uploading source maps during production builds;
    // in local dev, it is optional.
    authToken: env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN,
  };
  return {
    plugins: [
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      reactRouter(),
      sentryReactRouter(sentryConfig, config),
    ],
    ssr: {
      noExternal: [/@syncfusion/],
    },
    build: {
      cssMinify: false,
    },
    envPrefix: ["VITE_", "SENTRY_"],
  };
});
