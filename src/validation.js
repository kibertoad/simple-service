"use strict";

/**
 * Framework-agnostic validation helpers built on top of zod's `safeParse`.
 *
 * The service layer never parses payloads itself; it receives the typed `data`
 * produced here. All zod errors are normalized into a client-safe
 * `ValidationError` so the wire format is stable and never leaks internals.
 */

const { ZodError } = require("zod");

/**
 * Normalized validation error. Carries the structured issues that will be
 * serialized into the API error envelope.
 */
class ValidationError extends Error {
  /**
   * @param {string} message - Human-readable summary.
   * @param {Array<{path: string, message: string, code: string}>} issues
   */
  constructor(message, issues) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.status = 400;
    this.issues = Array.isArray(issues) ? issues : [];
  }

  /**
   * Convert to the API error envelope body (without the top-level `error`
   * wrapper that the handler adds). Kept stable and client-safe.
   */
  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      issues: this.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
        code: issue.code,
      })),
    };
  }
}

/**
 * Map a zod error into the normalized issue list. Paths are joined with "."
 * (empty path becomes "") so callers can pin failures to a field.
 *
 * @param {z.ZodError} zodError
 * @returns {Array<{path: string, message: string, code: string}>}
 */
function mapZodError(zodError) {
  // `zodError.issues` is the stable, version-agnostic accessor.
  return zodError.issues.map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path ?? ""),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Validate `payload` against `schema` without throwing.
 *
 * @template T
 * @param {import("zod").ZodSchema<T>} schema
 * @param {unknown} payload
 * @returns {{ success: true, data: T } | { success: false, error: ValidationError }}
 */
function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: new ValidationError(
      "Request payload failed validation",
      mapZodError(result.error)
    ),
  };
}

/**
 * Strict variant: validate and throw `ValidationError` on failure. Useful for
 * non-HTTP entrypoints (jobs, CLI) that want fail-fast semantics with the same
 * normalized error type.
 *
 * @template T
 * @param {import("zod").ZodSchema<T>} schema
 * @param {unknown} payload
 * @returns {T}
 * @throws {ValidationError}
 */
function validateOrThrow(schema, payload) {
  const result = validate(schema, payload);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

module.exports = {
  ValidationError,
  mapZodError,
  validate,
  validateOrThrow,
};
