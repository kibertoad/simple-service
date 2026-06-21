"use strict";

/**
 * PIIFilter – redacts or drops OpenTelemetry span/metric/log attributes
 * that match a denylist of sensitive key patterns.
 *
 * Implemented as a SpanProcessor-like wrapper around an exporter.
 * This keeps the filter in the export path without mutating the
 * application-side span objects after they finish.
 */

const DEFAULT_DENYLIST = [
  "authorization",
  "cookie",
  "password",
  "passwd",
  "secret",
  "token",
  "api_key",
  "apikey",
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
  "email",
  "phone",
  "ssn",
  "credit_card",
];

/**
 * Escape a literal string for safe use in a RegExp.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a RegExp that matches any of the configured denylist entries.
 * @param {string[]} patterns
 * @returns {RegExp}
 */
function buildDenyPattern(patterns) {
  const safe = patterns.map((p) => `.*${escapeRegExp(p.toLowerCase())}.*`);
  return new RegExp(`^(?:${safe.join("|")})$`, "i");
}

/**
 * @typedef {object} AttributeMap
 * @property {Record<string, unknown>} [attributes]
 */

class PIIFilter {
  /**
   * @param {object} [options]
   * @param {string[]} [options.denylist]
   */
  constructor(options = {}) {
    const denylist = options.denylist || DEFAULT_DENYLIST;
    this.pattern = buildDenyPattern(denylist);
    this.redactionText = "[REDACTED]";
  }

  /**
   * Return true if the key looks like a sensitive name.
   * @param {string} key
   * @returns {boolean}
   */
  isSensitive(key) {
    return typeof key === "string" && this.pattern.test(key);
  }

  /**
   * Redact a single span's attributes.
   * @param {AttributeMap} span
   * @returns {AttributeMap}
   */
  redactSpan(span) {
    if (!span.attributes || typeof span.attributes !== "object") return span;

    const next = { ...span, attributes: { ...span.attributes } };
    for (const key of Object.keys(next.attributes)) {
      if (this.isSensitive(key)) {
        next.attributes[key] = this.redactionText;
      }
    }
    return next;
  }

  /**
   * Redact an array of ReadableSpans/Span objects.
   * @param {any[]} spans
   * @returns {any[]}
   */
  redactSpans(spans) {
    return spans.map((s) => this.redactSpan(s));
  }
}

/**
 * Wrap an OTLP exporter so outgoing spans are redacted before export.
 *
 * @param {import('@opentelemetry/sdk-trace-base').SpanExporter} exporter
 * @param {string[]} [denylist]
 * @returns {import('@opentelemetry/sdk-trace-base').SpanExporter}
 */
function wrapExporter(exporter, denylist) {
  const filter = new PIIFilter({ denylist });

  return {
    export(spans, resultCallback) {
      try {
        exporter.export(filter.redactSpans(spans), resultCallback);
      } catch (err) {
        resultCallback({ code: 1, error: err });
      }
    },

    async shutdown() {
      return exporter.shutdown ? exporter.shutdown() : Promise.resolve();
    },

    async forceFlush() {
      return exporter.forceFlush ? exporter.forceFlush() : Promise.resolve();
    },
  };
}

module.exports = { PIIFilter, wrapExporter, DEFAULT_DENYLIST };
