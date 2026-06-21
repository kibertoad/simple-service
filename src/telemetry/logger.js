"use strict";

/**
 * Minimal structured logger that correlates log lines with the active
 * OpenTelemetry trace/span IDs.  This module intentionally does NOT replace
 * the application's existing logging framework; it enriches it.
 */

const { trace } = require("@opentelemetry/api");

/**
 * Extract trace and span IDs from the active span context, if any.
 * @returns {{ trace_id?: string, span_id?: string }}
 */
function correlationContext() {
  const span = trace.getActiveSpan();
  if (!span) return {};

  const ctx = span.spanContext();
  if (!ctx || !ctx.traceId) return {};

  return {
    trace_id: ctx.traceId,
    span_id: ctx.spanId,
  };
}

/**
 * Log a message with optional fields plus trace/span correlation.
 * @param {string} level
 * @param {string} message
 * @param {Record<string, unknown>} [fields]
 */
function log(level, message, fields = {}) {
  const line = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...correlationContext(),
    ...(fields || {}),
  };

  // Use stderr for errors/warnings, stdout for info/debug.
  const sink = level === "error" || level === "warn" ? console.error : console.log;
  sink(JSON.stringify(line));
}

/**
 * Create a logger object bound to this module's correlation logic.
 * @returns {{ info: Function, warn: Function, error: Function, debug: Function }}
 */
function createLogger() {
  return {
    info: (message, fields) => log("info", message, fields),
    warn: (message, fields) => log("warn", message, fields),
    error: (message, fields) => log("error", message, fields),
    debug: (message, fields) => log("debug", message, fields),
  };
}

module.exports = { createLogger, correlationContext };
