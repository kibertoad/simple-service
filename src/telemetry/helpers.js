"use strict";

/**
 * Thin manual instrumentation helpers for business-critical operations
 * not covered by auto-instrumentation.
 */

const { trace, metrics } = require("@opentelemetry/api");

const TRACER_NAME = "simple-express-app";
const METER_NAME = "simple-express-app";

/**
 * Execute an async function inside a named span.
 *
 * @template T
 * @param {string} name
 * @param {() => Promise<T> | T} fn
 * @param {Record<string, any>} [attributes]
 * @returns {Promise<T>}
 */
async function withSpan(name, fn, attributes = {}) {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startActiveSpan(name, (span) => {
    try {
      if (attributes) {
        Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
      }

      const result = fn();
      const settled = Promise.resolve(result);
      return settled.finally(() => {
        span.end();
      });
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message });
      span.end();
      throw err;
    }
  });
}

/**
 * Record a single metric value (counter or histogram).
 *
 * @param {"counter" | "histogram" | "updowncounter"} kind
 * @param {string} name
 * @param {number} value
 * @param {Record<string, any>} [attributes]
 */
function recordMetric(kind, name, value, attributes = {}) {
  const meter = metrics.getMeter(METER_NAME);

  switch (kind) {
    case "counter": {
      const counter = meter.createCounter(name);
      counter.add(value, attributes);
      break;
    }
    case "histogram": {
      const histogram = meter.createHistogram(name);
      histogram.record(value, attributes);
      break;
    }
    case "updowncounter": {
      const upDown = meter.createUpDownCounter(name);
      upDown.add(value, attributes);
      break;
    }
    default:
      throw new Error(`unsupported metric kind: ${kind}`);
  }
}

module.exports = { withSpan, recordMetric };
