const express = require("express");
const userRoutes = require("./users/userRoutes");
const { ValidationError, NotFoundError, ConflictError } = require("./users/errors");

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

  app.use("/users", userRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.message, details: err.details });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof ConflictError) {
      return res.status(409).json({ error: err.message });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = createApp;
