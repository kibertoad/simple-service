"use strict";

/**
 * Error types and a single JSON error handler for the Express app.
 *
 * Design rationale: controllers throw typed HttpError subclasses so the global
 * handler can map them to the correct status without leaking internals.
 * Zod validation errors are mapped to 400. Everything else becomes 500 with a
 * generic message (the stack is logged server-side only).
 */

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code || "error";
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message, "forbidden");
    this.name = "ForbiddenError";
  }
}

class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(409, message, "conflict");
    this.name = "ConflictError";
  }
}

class ServiceUnavailableError extends HttpError {
  constructor(message = "Service unavailable") {
    super(503, message, "service_unavailable");
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Express error-handling middleware (must be the last `app.use`).
 * Handles HttpError, zod validation errors, and unknown errors uniformly.
 */
function errorHandler(err, req, res, next) {
  // express-rate-limit sends { statusCode, message } on 429; let it pass.
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  // Zod v4 errors carry `issues` (zod v3 used `errors`).
  if (err && (err.name === "ZodError" || Array.isArray(err.issues) || Array.isArray(err.errors))) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      error: "Validation failed",
      code: "validation_error",
      issues: issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    });
  }

  // Unknown error: never leak internals to the client.
  // eslint-disable-next-line no-console
  console.error("[auth] unhandled error:", err);
  return res.status(500).json({ error: "Internal server error", code: "internal_error" });
}

module.exports = {
  HttpError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  errorHandler,
};
