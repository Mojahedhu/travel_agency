import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
const dsa = import.meta.env.VITE_SENTRY_DSN;
if (!dsa) throw new Error("VITE_SENTRY_DSN is not defined");

Sentry.init({
  dsn: dsa,
  integrations: [
    // Registers and configures the Tracing integration,
    // which automatically instruments your application to monitor its
    // performance, including custom React Router routing instrumentation
    Sentry.reactRouterTracingIntegration(),
    // Registers the Replay integration,
    // which automatically captures Session Replays
    Sentry.replayIntegration(),
    // Registers the User Feedback integration
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],
  // Enables Tracing.
  // Set to 1.0 to capture 100% of spans for tracing.
  // We recommend reducing this value in production.
  tracesSampleRate: 1.0,
  // Set `tracePropagationTargets` to declare which URL(s) should have trace propagation enabled
  tracePropagationTargets: [/^\//],
  // Capture replays for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Requires Sentry.replayIntegration()
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={Sentry.sentryOnError} />
    </StrictMode>,
  );
});
