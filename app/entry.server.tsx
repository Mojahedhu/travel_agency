import "../instrument.server";
import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import * as Sentry from "@sentry/react-router";

export const streamTimeout = 5_000;

const encoder = new TextEncoder();
const HEAD_CLOSE = encoder.encode("</head>");

function findSequence(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

// Inserts Sentry's trace <meta> tags right before the first `</head>`.
// This enables distributed tracing between client and server.
function injectTraceMetaTags(
  stream: ReadableStream<Uint8Array>,
  metaTags: string,
): ReadableStream<Uint8Array> {
  if (!metaTags) return stream;

  const metaBytes = encoder.encode(metaTags);
  let injected = false;

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (injected) {
          controller.enqueue(chunk);
          return;
        }
        const idx = findSequence(chunk, HEAD_CLOSE);
        if (idx === -1) {
          controller.enqueue(chunk);
          return;
        }
        injected = true;
        controller.enqueue(chunk.subarray(0, idx));
        controller.enqueue(metaBytes);
        controller.enqueue(chunk.subarray(idx));
      },
    }),
  );
}

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  // Read the trace data now, while we're still inside the request's span
  const metaTags = Sentry.getTraceMetaTags();

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell. Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  // Must happen BEFORE wrapping the stream, since `allReady` lives on the original.
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await stream.allReady;
  }

  const body = injectTraceMetaTags(stream, metaTags);

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

// Wrap the default export
export default Sentry.wrapSentryHandleRequest(handleRequest);

export const handleError = Sentry.createSentryHandleError({
  logErrors: false,
});

// Automatically instruments all server loaders, actions, middleware,
// and request handlers.
export const instrumentations = [Sentry.createSentryServerInstrumentation()];
