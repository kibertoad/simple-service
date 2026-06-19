const express = require("express");
const { EchoBodySchema } = require("./schemas");
const { validate, ValidationError } = require("./validation");

/**
 * Create and configure the Express application.
 * Kept separate from the server bootstrap so it can be tested in isolation.
 *
 * @returns {import("express").Express}
 */
function createApp() {
  const app = express();

  app.use(express.json());

  // Malformed JSON body is a client error (400), not a server fault (500).
  app.use((err, req, res, next) => {
    if (
      err instanceof SyntaxError &&
      typeof err.status === "number" &&
      err.status === 400 &&
      typeof err.body === "string"
    ) {
      return res.status(400).json({
        error: {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Request body is not valid JSON",
          issues: [
            {
              path: "body",
              message: "Could not parse JSON body",
              code: "invalid_type",
            },
          ],
        },
      });
    }
    next(err);
  });

  app.get("/", (req, res) => {
    res.json({ message: "Hello, Express!" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/echo", (req, res, next) => {
    // Validate at the trust boundary, before any business logic.
    const result = validate(EchoBodySchema, req.body);
    if (!result.success) {
      return next(result.error);
    }
    // Service layer receives already-validated, typed data.
    const data = result.data;
    res.json({ received: data });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
  });

  // Error handler
  app.use((err, req, res, next) => {
    // Normalized validation errors -> 400 with structured issues.
    if (err instanceof ValidationError) {
      return res.status(err.status).json({ error: err.toJSON() });
    }
    console.error(err);
    res.status(500).json({ error: { message: "Internal server error" } });
  });

  return app;
}

module.exports = createApp;
