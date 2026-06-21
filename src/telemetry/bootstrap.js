"use strict";

/**
 * OTelBootstrap
 *
 * One-shot initialization of OpenTelemetry tracing, metrics, and context
 * propagation for the Express service.  Designed for graceful degradation:
 * if initialization fails, the application logs a warning and continues
 * with the SDK's no-op providers.
 */

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { NodeTracerProvider, BatchSpanProcessor } = require("@opentelemetry/sdk-trace-node");
const { MeterProvider, PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-proto");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { W3CTraceContextPropagator, W3CBaggagePropagator, CompositePropagator } = require("@opentelemetry/core");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { trace, metrics, propagation, context } = require("@opentelemetry/api");

const { loadTelemetryConfig } = require("./config");
const { wrapExporter } = require("./piiFilter");
const { createLogger } = require("./logger");

const propagator = new CompositePropagator({
  propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
});

/**
 * Parse the OTEL_RESOURCE_ATTRIBUTES environment string into an object.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
function parseResourceAttributes(raw) {
  const out = /** @type {Record<string, string>} */ ({});
  if (!raw) return out;

  for (const pair of raw.split(",")) {
    const [key, ...rest] = pair.split("=");
    if (!key || rest.length === 0) continue;
    out[key.trim()] = rest.join("=").trim();
  }
  return out;
}

/**
 * Build the OpenTelemetry Resource.
 * @param {import("./types").TelemetryConfig} config
 * @returns {Resource}
 */
function buildResource(config) {
  const attrs = {
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.deploymentEnvironment,
  };

  if (config.serviceNamespace) {
    attrs[SemanticResourceAttributes.SERVICE_NAMESPACE] = config.serviceNamespace;
  }

  Object.assign(attrs, parseResourceAttributes(config.resourceAttributesString));

  return new Resource(attrs);
}

/**
 * Resolve the OTLP endpoint, accounting for protocol defaults.
 * @param {import("./types").TelemetryConfig} config
 * @returns {string | undefined}
 */
function resolveEndpoint(config) {
  if (!config.endpoint) return undefined;
  return config.endpoint;
}

/**
 * Build trace and metrics exporters, wrapped with PII filtering.
 *
 * @param {import("./types").TelemetryConfig} config
 * @returns {{ traceExporter: any | undefined, metricExporter: any | undefined }}
 */
function buildExporters(config) {
  const endpoint = resolveEndpoint(config);
  if (!endpoint) return { traceExporter: undefined, metricExporter: undefined };

  const common = { url: endpoint };

  const traceExporter = wrapExporter(new OTLPTraceExporter(common));
  const metricExporter = new OTLPMetricExporter(common);

  return { traceExporter, metricExporter };
}

/**
 * Build a tracer provider configured with batch export and sampling.
 *
 * @param {import("./types").TelemetryConfig} config
 * @param {Resource} resource
 * @param {any} traceExporter
 * @returns {NodeTracerProvider}
 */
function buildTracerProvider(config, resource, traceExporter) {
  let sampler;
  try {
    const { ParentBasedSampler, TraceIdRatioBasedSampler } = require("@opentelemetry/sdk-trace-base");
    sampler = new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(config.samplerArg),
    });
  } catch {
    sampler = undefined;
  }

  const provider = new NodeTracerProvider({
    resource,
    sampler,
  });

  if (traceExporter) {
    provider.addSpanProcessor(
      new BatchSpanProcessor(traceExporter, {
        maxQueueSize: config.batchMaxQueueSize,
        maxExportBatchSize: config.batchMaxExportBatchSize,
        scheduledDelayMillis: config.batchScheduleDelayMillis,
      }),
    );
  }

  return provider;
}

/**
 * Build a meter provider configured with periodic OTLP export.
 *
 * @param {import("./types").TelemetryConfig} config
 * @param {Resource} resource
 * @param {any} metricExporter
 * @returns {MeterProvider}
 */
function buildMeterProvider(config, resource, metricExporter) {
  const readers = [];

  if (metricExporter) {
    const exportIntervalMillis = Math.max(
      1000,
      Number.parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || "60000", 10) || 60000,
    );

    readers.push(
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis,
      }),
    );
  }

  return new MeterProvider({ resource, readers });
}

/**
 * Singleton bootstrap state.
 */
let sdk = null;
let shutdownFn = null;

/**
 * Initialize OpenTelemetry.  Safe to call once at process startup.
 *
 * The NodeSDK approach is used here to satisfy the OTel SDK contract with
 * proper context managers and a shared shutdown hook. If the SDK throws,
 * the function logs and returns a no-op shutdown callback so the app stays
 * alive.
 *
 * @returns {{ telemetryEnabled: boolean, shutdown: () => Promise<void>, config: import("./types").TelemetryConfig }}
 */
function bootstrapTelemetry() {
  const config = loadTelemetryConfig();
  const logger = createLogger();

  if (!config.enabled || !config.endpoint) {
    logger.info(`${config.logPrefix}: telemetry disabled (enabled=${config.enabled}, endpoint=${config.endpoint || "" || ""})`);
    return {
      telemetryEnabled: false,
      shutdown: () => Promise.resolve(),
      config,
    };
  }

  try {
    const resource = buildResource(config);
    const { traceExporter, metricExporter } = buildExporters(config);

    sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader:
        metricExporter
          ? new PeriodicExportingMetricReader({
              exporter: metricExporter,
              exportIntervalMillis: Math.max(
                1000,
                Number.parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || "60000", 10) || 60000,
              ),
            })
          : undefined,
      textMapPropagator: propagator,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();

    const provider = trace.getTracerProvider();
    const meterProvider = metrics.getMeterProvider();

    logger.info(`${config.logPrefix}: OpenTelemetry started`, {
      service: config.serviceName,
      environment: config.deploymentEnvironment,
      endpoint: config.endpoint,
      protocol: config.protocol,
      sampler: config.sampler,
      samplerArg: config.samplerArg,
      provider: provider ? "registered" : "none",
      meterProvider: meterProvider ? "registered" : "none",
    });

    shutdownFn = async () => {
      if (!sdk) return;
      try {
        await sdk.shutdown();
        logger.info(`${config.logPrefix}: OpenTelemetry shut down cleanly`);
      } catch (err) {
        logger.warn(`${config.logPrefix}: error during OpenTelemetry shutdown`, { error: err.message });
      }
    };

    return {
      telemetryEnabled: true,
      shutdown: shutdownFn,
      config,
    };
  } catch (err) {
    logger.error(`${config.logPrefix}: failed to initialize OpenTelemetry, continuing without telemetry`, {
      error: err.message,
    });

    return {
      telemetryEnabled: false,
      shutdown: () => Promise.resolve(),
      config,
    };
  }
}

/**
 * Get the active OpenTelemetry context manager.  Used by async middleware.
 * @returns {typeof context}
 */
function getContext() {
  return context;
}

/**
 * Get the active propagation API.  Used by W3C traceparent handling.
 * @returns {typeof propagation}
 */
function getPropagation() {
  return propagation;
}

module.exports = {
  bootstrapTelemetry,
  buildResource,
  buildExporters,
  buildTracerProvider,
  buildMeterProvider,
  getContext,
  getPropagation,
};
