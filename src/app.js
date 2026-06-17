const express = require("express");

/**
 * Create and configure the Express application.
 * Kept separate from the server bootstrap so it can be tested in isolation.
 *
 * @returns {import("express").Express}
 */
function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ message: "Hello, Express!" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/echo", (req, res) => {
    res.json({ received: req.body });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = createApp;
