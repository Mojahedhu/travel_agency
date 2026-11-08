import * as Sentry from "@sentry/react-router";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
const dsn = import.meta.env.VITE_SENTRY_DSN || import.meta.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn: dsn,
    // Enables Profiling
    integrations: [nodeProfilingIntegration()],
    // Enables Tracing.
    // Set to 1.0 to capture 100% of spans for tracing.
    // We recommend reducing this value in production.
    tracesSampleRate: 1.0,
    // Enables Profiling for all sessions.
    // We recommend reducing this value in production.
    profileSessionSampleRate: 1.0,
  });
}
