"use strict";

/**
 * Shared zod primitives for inbound request payloads.
 *
 * These are intentionally small, pre-compiled, and reusable so that
 * per-resource schemas stay in sync and avoid drift. Constructing schemas
 * inside handlers is forbidden — always import from here (or a resource
 * schema built on top of these).
 */

const { z } = require("zod");

/**
 * Email address. Lowercased and trimmed to normalize storage/lookup.
 * Capped at 254 chars (RFC 5321 practical limit).
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email must be at most 254 characters")
  .email("Must be a valid email address");

/**
 * Opaque resource identifier. Allows UUIDs (any version) and short
 * alphanumeric slugs commonly used for human-friendly ids. Kept string-based
 * since path/query params always arrive as strings.
 */
const idSchema = z
  .string()
  .trim()
  .min(1, "Id is required")
  .max(64, "Id must be at most 64 characters")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Id must contain only letters, numbers, hyphens and underscores"
  );

/**
 * Free-form text field with a sensible upper bound to bound request size.
 *
 * @param {number} [max=1024] - Maximum number of characters.
 * @param {string} [label="Value"] - Field label used in error messages.
 */
function textSchema(max = 1024, label = "Value") {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error(`textSchema max must be a positive integer, got: ${max}`);
  }
  return z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`);
}

/**
 * ISO-8601 timestamp string. Accepts the common `YYYY-MM-DDTHH:mm:ss.sssZ`
 * shape and its timezone-offset variants. Parsed loosely on purpose — exact
 * temporal validation belongs to the service layer.
 */
const timestampSchema = z
  .string()
  .trim()
  .max(64, "Timestamp must be at most 64 characters")
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/,
    "Must be an ISO-8601 timestamp"
  );

/**
 * Pagination query parameters. Defaults are applied on the parsed output, so
 * downstream code receives concrete numbers. Bounds prevent absurd values.
 *
 * Note: `.default()` mutates the parsed output (not the input) — callers get a
 * normalized copy.
 */
const paginationSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

module.exports = {
  emailSchema,
  idSchema,
  textSchema,
  timestampSchema,
  paginationSchema,
};
