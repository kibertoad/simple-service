const express = require("express");
const { createUserStore } = require("./store/userStore");
const { createUserService } = require("./service/userService");
const { createUsersRouter } = require("./routes/users");
const { DomainError } = require("./domain/errors");

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

  // User routes
  const userStore = createUserStore();
  const userService = createUserService({ store: userStore });
  app.use("/users", createUsersRouter({ userService }));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    if (err instanceof DomainError) {
      res.status(err.status).json({ error: err.message, code: err.code });
      return;
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      res.status(400).json({ error: "Invalid JSON", code: "INVALID_JSON" });
      return;
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = createApp;
