"use strict";

/**
 * Application entrypoint.
 *
 * OpenTelemetry must be initialized before any framework or library code is
 * imported so that auto-instrumentation can patch modules.  For this reason
 * bootstrapTelemetry is called first, then Express is created/started.
 */

const { bootstrapTelemetry } = require("./telemetry");

const { telemetryEnabled, shutdown: shutdownTelemetry, config } = bootstrapTelemetry();

const createApp = require("./app");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  console.log(
    JSON.stringify({
      level: "info",
      message: "Server listening",
      host: HOST,
      port: PORT,
      telemetryEnabled,
      serviceName: config.serviceName,
      deploymentEnvironment: config.deploymentEnvironment,
      timestamp: new Date().toISOString(),
    }),
  );
});

// Graceful shutdown
function shutdown(signal) {
  console.log(
    JSON.stringify({
      level: "info",
      message: `${signal} received, closing server...`,
      timestamp: new Date().toISOString(),
    }),
  );

  server.close(async () => {
    await shutdownTelemetry();
    console.log(
      JSON.stringify({
        level: "info",
        message: "Server closed.",
        timestamp: new Date().toISOString(),
      }),
    );
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = server;
