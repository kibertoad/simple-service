"use strict";

/**
 * Express middleware that:
 *   1. Ensures the OpenTelemetry async context is active for the request.
 *   2. Enriches the active span with route-level attributes.
 *   3. Injects trace_id/span_id into response headers for client correlation.
 */

const { trace, context } = require("@opentelemetry/api");

/**
 * Middleware that attaches OpenTelemetry context to the Express request.
 *
 * The upstream http instrumentation already creates a server span and binds
 * context, but this middleware ensures additional route attributes are set
 * once the route is known. It also exposes correlation IDs to callers.
 *
 * @returns {import("express").RequestHandler}
 */
function telemetryMiddleware() {
  return (req, res, next) => {
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      if (spanContext && spanContext.traceId) {
        res.setHeader("X-Trace-Id", spanContext.traceId);
        res.setHeader("X-Span-Id", spanContext.spanId);
      }

      if (req.route && req.route.path) {
        span.setAttribute("http.route", req.route.path);
      }
    }

    next();
  };
}

module.exports = { telemetryMiddleware };
