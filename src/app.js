const express = require("express");
const { createAuth } = require("./auth");
const { errorHandler } = require("./errors");

/**
 * Create and configure the Express application.
 * Kept separate from the server bootstrap so it can be tested in isolation.
 *
 * @param {object} [options]
 * @param {object} [options.auth] auth overrides forwarded to createAuth (for tests)
 * @returns {{ app: import("express").Express, auth: ReturnType<typeof createAuth> }}
 */
function createApp(options = {}) {
  const app = express();

  app.use(express.json());

  // Auth building block: passport strategies + /auth router + middleware.
  const auth = createAuth(options.auth);
  app.use(passport_initialize(auth.passport));
  app.use("/auth", auth.router);

  app.get("/", (req, res) => {
    res.json({ message: "Hello, Express!" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/echo", (req, res) => {
    res.json({ received: req.body });
  });

  // Example protected route demonstrating requireAuth + requireRole.
  // Requires Authorization: Bearer <accessToken> and the "admin" role.
  app.get("/admin", auth.requireAuth, auth.requireRole("admin"), (req, res) => {
    res.json({ message: `Hello admin ${req.user.email}` });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return { app, auth };
}

// Thin wrapper so we only call passport.initialize() once per app instance.
function passport_initialize(pp) {
  return pp.initialize();
}

module.exports = createApp;
