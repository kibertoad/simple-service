"use strict";

/**
 * Public telemetry package API.
 */

const { bootstrapTelemetry } = require("./bootstrap");
const { withSpan, recordMetric } = require("./helpers");
const { createLogger } = require("./logger");

module.exports = {
  bootstrapTelemetry,
  withSpan,
  recordMetric,
  createLogger,
};
