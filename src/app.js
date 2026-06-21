"use strict";

const express = require("express");
const { telemetryMiddleware } = require("./telemetry/middleware");
const { withSpan } = require("./telemetry/helpers");

/**
 * Create and configure the Express application.
 * Kept separate from the server bootstrap so it can be tested in isolation.
 *
 * @returns {import("express").Express}
 */
function createApp() {
  const app = express();

  app.use(express.json());
  app.use(telemetryMiddleware());

  app.get("/", (req, res) => {
    res.json({ message: "Hello, Express!" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/echo", (req, res) => {
    res.json({ received: req.body });
  });

  app.get("/work", async (req, res, next) => {
    try {
      const result = await withSpan("work-handler", async () => {
        // Simulate a small amount of traced business logic.
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { done: true };
      }, { "work.type": "demo" });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = createApp;
