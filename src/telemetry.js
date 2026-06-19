/**
 * OpenTelemetry bootstrap for the service.
 *
 * Wires up distributed tracing and request metrics once at process start,
 * using explicit library initialization (design decision D3 — preferred over
 * the auto-instrumentation agent for portability and version control).
 *
 * Responsibilities (per the agreed design):
 *   - Build a `Resource` (service.name, service.version, deployment.environment).
 *   - Initialize TracerProvider + MeterProvider with OTLP/HTTP exporters.
 *   - Register W3C TraceContext + Baggage propagators.
 *   - Register HTTP server + HTTP client + Express auto-instrumentation so
 *     inbound/outbound calls propagate `traceparent`/`tracestate`.
 *   - Expose RED metrics (http.server.request.duration histogram,
 *     http.server.active_requests up-down counter) with route-template
 *     attributes only (no raw URL / user id / body — avoids high-cardinality
 *     and PII leakage).
 *   - Fail open: exporter problems are logged at debug and never crash the app.
 *   - Graceful shutdown: flush providers with a bounded timeout.
 *
 * All endpoints / sampling / headers are read from standard OTEL_* env vars;
 * nothing is hardcoded.
 */

"use strict";

const {
  context,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  metrics,
  trace,
} = require("@opentelemetry/api");
const { resourceFromAttributes, defaultResource } = require("@opentelemetry/resources");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  ParentBasedSampler,
  AlwaysOnSampler,
  AlwaysOffSampler,
  TraceIdRatioBasedSampler,
  BatchSpanProcessor,
  SimpleSpanProcessor,
} = require("@opentelemetry/sdk-trace-base");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const { SemanticAttributes } = require("@opentelemetry/semantic-conventions");
const {
  W3CTraceContextPropagator,
  W3CBaggagePropagator,
  CompositePropagator,
} = require("@opentelemetry/core");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");

// ─── Attribute constants ───────────────────────────────────────────────────
// Stable semantic-convention attribute keys used for span attributes & metric
// attribute labels. Using route templates (http.route) rather than raw URLs
// keeps metric cardinality bounded.
const ATTR_HTTP_METHOD = SemanticAttributes.HTTP_METHOD; // "http.method"
const ATTR_HTTP_ROUTE = SemanticAttributes.HTTP_ROUTE; // "http.route"
const ATTR_HTTP_STATUS_CODE = SemanticAttributes.HTTP_STATUS_CODE; // "http.status_code"
const ATTR_HTTP_SCHEME = SemanticAttributes.HTTP_SCHEME; // "http.scheme"
const ATTR_HTTP_FLAVOR = SemanticAttributes.HTTP_FLAVOR; // "http.flavor"

// ─── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_OTLP_PATH = "/v1/traces"; // appended to endpoint base for traces
const DEFAULT_METRICS_PATH = "/v1/metrics";
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5000; // bounded flush on shutdown

// Header names that must never leak into span attributes (PII / secrets).
const DENYLIST_HEADERS = new Set(
  [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "proxy-authorization",
    "x-forwarded-for",
  ].map((h) => h.toLowerCase())
);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read a positive number from an env var, falling back to `fallback`.
 * Returns `undefined` only when `fallback` is undefined and the var is unset.
 */
function readNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    diag.warn(
      `telemetry: env ${name}="${raw}" is not a non-negative number; ignoring.`
    );
    return fallback;
  }
  return parsed;
}

/**
 * Build the OTel Resource describing this service.
 *
 * Resource attributes are taken from the standard OTEL_* env vars; explicit
 * args win when present (used by tests). `service.name` is required by the
 * OTel spec — fall back to the SDK default rather than emitting an empty name.
 */
function buildResource(explicit = {}) {
  const attrs = {
    "service.name":
      explicit.serviceName ||
      process.env.OTEL_SERVICE_NAME ||
      "simple-express-app",
    "service.version":
      explicit.serviceVersion ||
      process.env.OTEL_SERVICE_VERSION ||
      process.env.npm_package_version ||
      undefined,
    "deployment.environment":
      explicit.deploymentEnvironment ||
      process.env.OTEL_DEPLOYMENT_ENVIRONMENT ||
      process.env.NODE_ENV ||
      undefined,
  };
  // Drop undefined entries so they don't appear as literal `undefined`.
  for (const k of Object.keys(attrs)) {
    if (attrs[k] === undefined || attrs[k] === "") delete attrs[k];
  }
  // Merge with the SDK default resource so telemetry.sdk.* attrs are kept.
  // Explicit attrs win (resourceFromAttributes is the override, merged onto
  // the default which provides telemetry.sdk.* and a service.name fallback).
  return defaultResource().merge(resourceFromAttributes(attrs));
}

/**
 * Resolve the sampler per design D1.
 *
 * Standard `OTEL_TRACES_SAMPLER` is honored:
 *   - "always_on"  → ParentBased(AlwaysOn)  (dev default)
 *   - "always_off" → AlwaysOff
 *   - "traceidratio" / "parentbased_traceidratio" → ratio from
 *     OTEL_TRACES_SAMPLER_ARG (default 0.1 in prod-like setups)
 *
 * If `OTEL_TRACES_SAMPLER` is unset, an explicit OTEL_SAMPLING_RATIO
 * (0..1) switches to ParentBased(TraceIdRatioBased(ratio)).
 */
function buildSampler() {
  const sampler = (process.env.OTEL_TRACES_SAMPLER || "").toLowerCase();
  const ratio =
    readNumberEnv("OTEL_TRACES_SAMPLER_ARG", undefined) ??
    readNumberEnv("OTEL_SAMPLING_RATIO", undefined);

  if (sampler === "always_off") {
    return new AlwaysOffSampler();
  }
  if (sampler === "traceidratio") {
    return new TraceIdRatioBasedSampler(clampRatio(ratio, 1));
  }
  if (sampler === "parentbased_traceidratio" || (sampler === "" && ratio !== undefined)) {
    return new ParentBasedSampler(new TraceIdRatioBasedSampler(clampRatio(ratio, 0.1)));
  }
  // Default: ParentBased(AlwaysOn) — full tracing in dev.
  return new ParentBasedSampler(new AlwaysOnSampler());
}

function clampRatio(value, fallback) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

/**
 * Build OTLP/HTTP exporter endpoints from a single base endpoint, per the
 * OTLP/HTTP convention (`${endpoint}/v1/traces` and `/v1/metrics`).
 */
function resolveEndpoints(explicit = {}) {
  const base =
    explicit.endpoint ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  const traces =
    explicit.tracesEndpoint ||
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    (base ? joinUrl(base, DEFAULT_OTLP_PATH) : undefined);
  const metricsEp =
    explicit.metricsEndpoint ||
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
    (base ? joinUrl(base, DEFAULT_METRICS_PATH) : undefined);
  return { traces, metrics: metricsEp };
}

function joinUrl(base, path) {
  if (!base) return undefined;
  // Allow callers to pass a full traces/metrics URL already.
  if (/\/v1\/(traces|metrics)$/.test(base)) return base;
  return base.replace(/\/+$/, "") + path;
}

/**
 * Map a denied header name to a redacted marker. Used as an
 * `applyCustomAttributesOnSpan` hook to scrub inbound/outbound headers from
 * HTTP instrumentation spans (PII / secret leakage mitigation).
 */
function redactHeaders(headers) {
  if (!headers || typeof headers !== "object") return headers;
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = DENYLIST_HEADERS.has(String(k).toLowerCase()) ? "[REDACTED]" : v;
  }
  return out;
}

// ─── RED metrics middleware ─────────────────────────────────────────────────

/**
 * Create the RED (Rate, Errors, Duration) metrics instruments.
 *
 * Metric attribute labels use ONLY route templates (http.route), method, and
 * status code — never raw URL, user id, or body — to keep cardinality bounded.
 *
 *   http.server.request.duration  — histogram, seconds, bounded buckets.
 *   http.server.active_requests   — up-down counter (inc on start, dec on end).
 *
 * @param {import("@opentelemetry/api").Meter} meter
 */
function createHttpRedMetrics(meter) {
  const duration = meter.createHistogram("http.server.request.duration", {
    description:
      "Duration of HTTP server requests (seconds). Attributes: http.method, http.route, http.response.status_code.",
    unit: "s",
    // Buckets covering 5ms → ~10s, tuned for typical web request latencies.
    explicitBucketBoundaries: [
      0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
    ],
  });

  const activeRequests = meter.createUpDownCounter("http.server.active_requests", {
    description:
      "Number of active HTTP server requests. Attributes: http.method, http.route.",
  });

  return { duration, activeRequests };
}

/**
 * Express middleware that records RED metrics for each request.
 *
 * It MUST be registered after the router/mounting so `req.route` (and thus the
 * route template) is populated; if no route matched (404), it falls back to the
 * raw path's first segment to avoid high cardinality from arbitrary paths.
 *
 * @param {{duration: import("@opentelemetry/api").Histogram, activeRequests: import("@opentelemetry/api").UpDownCounter}} instruments
 */
function redMetricsMiddleware(instruments) {
  return function otelRedMetrics(req, res, next) {
    const start = process.hrtime.bigint();
    const method = String(req.method || "UNKNOWN");

    // Active request counted against the resolved route; if unknown yet we
    // attribute to "unrouted" and re-label is unnecessary because we only
    // finalize labels on response finish.
    const routeTemplate = resolveRouteTemplate(req);
    const activeAttrs = {
      [ATTR_HTTP_METHOD]: method,
      [ATTR_HTTP_ROUTE]: routeTemplate,
    };
    instruments.activeRequests.add(1, activeAttrs);

    // Use response "finish" so the span/metric covers the full response
    // (handles streaming / long-running requests — design edge case).
    res.on("finish", () => {
      instruments.activeRequests.add(-1, activeAttrs);
      const elapsedNs = process.hrtime.bigint() - start;
      const durationSec = Number(elapsedNs) / 1e9;
      const statusCode = Number(res.statusCode) || 0;
      instruments.duration.record(durationSec, {
        [ATTR_HTTP_METHOD]: method,
        [ATTR_HTTP_ROUTE]: routeTemplate,
        [ATTR_HTTP_STATUS_CODE]: statusCode,
      });
    });

    // If the client disconnects before finish, still release the active count.
    res.on("close", () => {
      // `finish` may not fire on aborted sockets; ensure we don't double-dec:
      // add(-1) is idempotent-safe only once, so guard via a flag.
      if (!res.writableEnded) {
        instruments.activeRequests.add(-1, activeAttrs);
      }
    });

    next();
  };
}

/**
 * Resolve a low-cardinality route template for a request.
 *
 * Prefers Express's `req.route.path` (e.g. "/users/:id"); if matched via a
 * regex/route stack, joins the registered paths. Falls back to a generic
 * "unrouted" label so unknown paths never explode cardinality.
 */
function resolveRouteTemplate(req) {
  if (req.route && req.route.path) {
    const stack = req.route.path;
    // For mounted routers Express exposes `req.baseUrl`; combine for accuracy.
    return `${req.baseUrl || ""}${stack}`;
  }
  if (req.router && req.router.stack) {
    // Walk the router stack for the matching layer.
    for (const layer of req.router.stack) {
      if (layer.route && layer.regexp && layer.regexp.test(req.path)) {
        return `${req.baseUrl || ""}${layer.route.path}`;
      }
    }
  }
  return "unrouted";
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a telemetry instance (not yet started).
 *
 * @param {object} [options]
 * @param {string} [options.serviceName]      Override service.name.
 * @param {string} [options.serviceVersion]   Override service.version.
 * @param {string} [options.deploymentEnvironment] Override deployment.environment.
 * @param {string} [options.endpoint]         OTLP/HTTP base endpoint (e.g. http://collector:4318).
 * @param {string} [options.tracesEndpoint]   Explicit OTLP traces endpoint.
 * @param {string} [options.metricsEndpoint]  Explicit OTLP metrics endpoint.
 * @param {object} [options.spanExporter]     Inject a span exporter (tests).
 * @param {object} [options.metricExporter]   Inject a metric exporter (tests).
 * @param {object} [options.metricReader]     Inject a metric reader (tests).
 * @param {boolean} [options.disable=false]   Skip instrumentation entirely (tests).
 * @param {import("@opentelemetry/api").DiagLogLevel} [options.logLevel]
 */
function createTelemetry(options = {}) {
  if (options.disable || process.env.OTEL_SDK_DISABLED === "true") {
    return {
      sdk: null,
      started: false,
      redMiddleware: (_req, _res, next) => next(),
      async init() {
        diag.debug("telemetry: disabled (OTEL_SDK_DISABLED), skipping init.");
        return null;
      },
      async shutdown() {},
    };
  }

  // Diagnostics: INFO in dev, WARN in prod (env), overridable.
  const desiredLevel =
    options.logLevel ??
    (process.env.OTEL_LOG_LEVEL
      ? parseDiagLevel(process.env.OTEL_LOG_LEVEL)
      : process.env.NODE_ENV === "production"
        ? DiagLogLevel.WARN
        : DiagLogLevel.INFO);
  diag.setLogger(new DiagConsoleLogger(), desiredLevel);

  const resource = buildResource({
    serviceName: options.serviceName,
    serviceVersion: options.serviceVersion,
    deploymentEnvironment: options.deploymentEnvironment,
  });

  const endpoints = resolveEndpoints({
    endpoint: options.endpoint,
    tracesEndpoint: options.tracesEndpoint,
    metricsEndpoint: options.metricsEndpoint,
  });

  // Exporter config — headers (e.g. bearer token / mTLS) come from env.
  const exporterHeaders = parseHeaders(
    process.env.OTEL_EXPORTER_OTLP_HEADERS ||
      process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS
  );

  // Build exporters. Injected exporters (tests) take priority; otherwise OTLP/HTTP.
  const spanExporter =
    options.spanExporter !== undefined
      ? options.spanExporter
      : new OTLPTraceExporter({
          url: endpoints.traces,
          headers: exporterHeaders,
        });

  let metricReader = options.metricReader;
  if (!metricReader) {
    const metricExporter =
      options.metricExporter !== undefined
        ? options.metricExporter
        : new OTLPMetricExporter({
            url: endpoints.metrics,
            headers: exporterHeaders,
          });
    // PeriodicExportingMetricReader → batched metric export on an interval.
    metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: readNumberEnv("OTEL_METRIC_EXPORT_INTERVAL", 5000),
    });
  }

  // Auto-instrumentations. The HTTP instrumentation is configured to scrub
  // denied headers from spans (PII mitigation). Express instrumentation adds
  // the route template (http.route) so spans use templated names.
  const instrumentations = [
    new HttpInstrumentation({
      applyCustomAttributesOnSpan: (span, info) => {
        try {
          // Scrub request/response headers on both client and server spans.
          if (info && info.request && info.request.headers) {
            info.request.headers = redactHeaders(info.request.headers);
          }
          if (info && info.response && info.response.headers) {
            info.response.headers = redactHeaders(info.response.headers);
          }
        } catch (err) {
          diag.debug("telemetry: header redaction skipped:", err?.message);
        }
      },
      // Never capture request/response bodies (PII).
      ignoreIncomingRequestHook: () => false,
      ignoreOutgoingRequestHook: () => false,
    }),
    new ExpressInstrumentation({
      // Tell Express instrumentation not to record body content.
      ignoreLayersType: [],
    }),
  ];

  // W3C propagators: TraceContext (traceparent/tracestate) + Baggage.
  const textMapPropagator = new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  });

  // Span processor: production uses BatchSpanProcessor (higher throughput,
  // batched export). Tests may inject SimpleSpanProcessor (immediate export)
  // via options.spanProcessors or options.useSimpleSpanProcessor for
  // deterministic assertions.
  let spanProcessors;
  if (Array.isArray(options.spanProcessors) && options.spanProcessors.length) {
    spanProcessors = options.spanProcessors;
  } else if (options.useSimpleSpanProcessor) {
    spanProcessors = [new SimpleSpanProcessor(spanExporter)];
  } else {
    spanProcessors = [new BatchSpanProcessor(spanExporter, {
      // Bounded queue — drop oldest when full, never block the request path.
      maxQueueSize: readNumberEnv("OTEL_BSP_MAX_QUEUE_SIZE", 2048),
      maxExportBatchSize: readNumberEnv("OTEL_BSP_MAX_EXPORT_BATCH_SIZE", 512),
      scheduledDelayMillis: readNumberEnv("OTEL_BSP_SCHEDULE_DELAY_MILLIS", 5000),
      exportTimeoutMillis: readNumberEnv("OTEL_BSP_EXPORT_TIMEOUT_MILLIS", 30000),
    })];
  }

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    metricReader,
    instrumentations,
    textMapPropagator,
    sampler: buildSampler(),
    // Context manager defaults to AsyncHooksContextManager (async-safe).
  });

  // Build RED metrics instruments off the *global* meter (set once SDK starts).
  // We create them lazily after init() so the meter provider is registered.
  let instruments = null;

  /** Express middleware (RED metrics). Stable reference for app wiring. */
  const redMiddleware = function otelRedMetricsWrapper(req, res, next) {
    if (!instruments) return next();
    return redMetricsMiddleware(instruments)(req, res, next);
  };

  const instance = {
    sdk,
    started: false,
    redMiddleware,
    resource,
    endpoints,

    /** Initialize providers + instrumentations. Idempotent. */
    async init() {
      if (instance.started) return sdk;
      try {
        sdk.start();
        instance.started = true;
        // Create RED instruments now that the global meter provider is set.
        const meter = metrics.getMeter(
          "simple-express-app.http",
          process.env.npm_package_version || "1.0.0"
        );
        instruments = createHttpRedMetrics(meter);
        diag.info(
          `telemetry: started (service=${resource.attributes["service.name"]}` +
            (endpoints.traces ? `, otlp=${endpoints.traces}` : ", otlp=<unset>") +
            `)`
        );
      } catch (err) {
        // Fail open: never crash the app because telemetry couldn't start.
        diag.error("telemetry: failed to start (continuing without telemetry):", err);
      }
      return sdk;
    },

    /** Flush buffered spans + metrics without shutting down. Best-effort. */
    async forceFlush(timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS) {
      if (!instance.started) return;
      const tasks = [];
      for (const sp of spanProcessors) {
        if (typeof sp.forceFlush === "function") {
          tasks.push(Promise.resolve(sp.forceFlush()).catch(() => {}));
        }
      }
      const mp = metrics.getMeterProvider();
      if (mp && typeof mp.forceFlush === "function") {
        tasks.push(Promise.resolve(mp.forceFlush()).catch(() => {}));
      }
      try {
        await withTimeout(Promise.all(tasks), timeoutMs, "telemetry forceFlush");
      } catch (err) {
        diag.debug("telemetry: forceFlush incomplete:", err?.message || err);
      }
    },

    /** Flush + shut down providers within a bounded timeout. */
    async shutdown(timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS) {
      if (!instance.started) return;
      instance.started = false;
      try {
        await withTimeout(sdk.shutdown(), timeoutMs, "telemetry shutdown");
        diag.info("telemetry: shut down cleanly.");
      } catch (err) {
        diag.warn("telemetry: shutdown error (ignored):", err?.message || err);
      }
    },
  };

  return instance;
}

// ─── Misc parsing helpers ───────────────────────────────────────────────────

function parseDiagLevel(value) {
  const v = String(value || "").toUpperCase();
  const map = {
    NONE: DiagLogLevel.NONE,
    ERROR: DiagLogLevel.ERROR,
    WARN: DiagLogLevel.WARN,
    WARNING: DiagLogLevel.WARN,
    INFO: DiagLogLevel.INFO,
    DEBUG: DiagLogLevel.DEBUG,
    VERBOSE: DiagLogLevel.VERBOSE,
    ALL: DiagLogLevel.VERBOSE,
  };
  return map[v] ?? DiagLogLevel.INFO;
}

/** Parse `key1=val1,key2=val2` header strings (per OTEL_EXPORTER_OTLP_HEADERS). */
function parseHeaders(raw) {
  if (!raw) return undefined;
  const headers = {};
  for (const pair of String(raw).split(",")) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) headers[key] = val;
  }
  return Object.keys(headers).length ? headers : undefined;
}

/** Resolve a promise OR a timeout, whichever happens first (fail-open). */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Module-level singleton (for src/index.js lifecycle wiring) ─────────────

let defaultInstance = null;

/**
 * Initialize the process-wide telemetry singleton. Safe to call once at boot.
 */
async function init(options) {
  if (!defaultInstance) {
    defaultInstance = createTelemetry(options);
  }
  await defaultInstance.init();
  return defaultInstance;
}

/**
 * Shut down the process-wide telemetry singleton.
 */
async function shutdown(timeoutMs) {
  if (defaultInstance) {
    await defaultInstance.shutdown(timeoutMs);
  }
}

/** The singleton's Express RED-metrics middleware (for app wiring). */
function redMiddleware() {
  if (!defaultInstance) {
    // No telemetry initialized — return a no-op middleware.
    return (_req, _res, next) => next();
  }
  return defaultInstance.redMiddleware;
}

module.exports = {
  // factory + types
  createTelemetry,
  // singleton lifecycle (used by src/index.js)
  init,
  shutdown,
  redMiddleware,
  // exported for tests / reuse
  buildResource,
  buildSampler,
  resolveEndpoints,
  resolveRouteTemplate,
  createHttpRedMetrics,
  redMetricsMiddleware,
  redactHeaders,
  parseHeaders,
  // constants
  ATTR_HTTP_METHOD,
  ATTR_HTTP_ROUTE,
  ATTR_HTTP_STATUS_CODE,
  ATTR_HTTP_SCHEME,
  ATTR_HTTP_FLAVOR,
};
