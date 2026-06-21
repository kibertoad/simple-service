"use strict";

/**
 * Configuration loader for OpenTelemetry bootstrap.
 *
 * Reads from environment variables using the standard OTel names where
 * applicable, with safe defaults. An unset OTLP endpoint means telemetry
 * remains inert via no-op providers.
 *
 * Environment variables:
 *   OTEL_ENABLED                       - "true" | "false" (default: "false")
 *   OTEL_EXPORTER_OTLP_ENDPOINT        - base URL for OTLP (e.g. http://otel-collector:4318)
 *   OTEL_SERVICE_NAME                  - service.name resource attribute
 *   OTEL_SERVICE_VERSION               - service.version resource attribute
 *   OTEL_SERVICE_NAMESPACE             - service.namespace resource attribute
 *   OTEL_DEPLOYMENT_ENVIRONMENT        - deployment.environment resource attribute
 *   OTEL_RESOURCE_ATTRIBUTES           - comma-separated key=value pairs appended to Resource
 *   OTEL_TRACES_SAMPLER_ARG            - sampling ratio 0..1 (default: "0.1")
 *   OTEL_TRACES_SAMPLER                - sampler name (default: "parentbased_traceidratio")
 *   OTEL_EXPORTER_OTLP_PROTOCOL        - "http/protobuf" | "grpc" (default: "http/protobuf")
 *   OTEL_BSP_MAX_QUEUE_SIZE            - max number of pending spans (default: 2048)
 *   OTEL_BSP_MAX_EXPORT_BATCH_SIZE     - max spans per export request (default: 512)
 *   OTEL_BSP_SCHEDULE_DELAY_MILLIS     - batch delay in ms (default: 5000)
 */

const PREFIX = "OTEL_TELEMETRY";

/**
 * Parse a human-readable boolean from an environment value.
 * @param {string | undefined} value
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

/**
 * Parse a non-negative integer from an environment value.
 * @param {string | undefined} value
 * @param {number} defaultValue
 * @returns {number}
 */
function parseIntSafe(value, defaultValue) {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? defaultValue : parsed;
}

/**
 * Build the telemetry configuration object.
 * @returns {import("./types").TelemetryConfig}
 */
function loadTelemetryConfig() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "";
  const enabled = parseBool(process.env.OTEL_ENABLED, false);

  const samplerArgRaw = process.env.OTEL_TRACES_SAMPLER_ARG || "0.1";
  const samplerArg = Number.parseFloat(samplerArgRaw);

  return {
    enabled,
    endpoint,
    protocol: (process.env.OTEL_EXPORTER_OTLP_PROTOCOL || "http/protobuf").toLowerCase(),
    serviceName: process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || "simple-express-app",
    serviceVersion: process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version || "1.1.0",
    serviceNamespace: process.env.OTEL_SERVICE_NAMESPACE || undefined,
    deploymentEnvironment: process.env.OTEL_DEPLOYMENT_ENVIRONMENT || "local",
    resourceAttributesString: process.env.OTEL_RESOURCE_ATTRIBUTES || "",
    sampler: process.env.OTEL_TRACES_SAMPLER || "parentbased_traceidratio",
    samplerArg: Number.isNaN(samplerArg) ? 0.1 : Math.max(0, Math.min(1, samplerArg)),
    batchMaxQueueSize: parseIntSafe(process.env.OTEL_BSP_MAX_QUEUE_SIZE, 2048),
    batchMaxExportBatchSize: parseIntSafe(process.env.OTEL_BSP_MAX_EXPORT_BATCH_SIZE, 512),
    batchScheduleDelayMillis: parseIntSafe(process.env.OTEL_BSP_SCHEDULE_DELAY_MILLIS, 5000),
    logPrefix: PREFIX,
  };
}

module.exports = { loadTelemetryConfig };
