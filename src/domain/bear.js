const { ValidationError } = require("./errors");

/**
 * Allowed pattern for Bear names.
 * - Must be 1..100 characters (the pattern itself allows up to 100).
 * - Must start with a Unicode letter, mark, or number.
 * - Subsequent characters may include Unicode letters, marks, numbers,
 *   spaces, periods, apostrophes, or hyphens.
 */
const NAME_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .'\-]{0,99}$/u;

function isPresentString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Build a persisted Bear object with exactly the allowed fields.
 * This deliberately ignores any extra keys from the input object.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.name
 * @param {number} params.age
 * @param {string} params.colour
 * @returns {{id: string, name: string, age: number, colour: string}}
 */
function buildBear({ id, name, age, colour }) {
  return { id, name, age, colour };
}

/**
 * Validate the mutable fields for a Bear create or update.
 * Age must be a non-negative integer. Name must be a unique-style
 * non-empty string up to 100 characters matching NAME_PATTERN.
 *
 * Design note on REQ-010-AC-05 ("omits one or more mutable fields"):
 * This criterion is interpreted as "the request representation entirely
 * supersedes the previous mutable state"; name and age remain mandatory
 * because update must satisfy all creation validation rules (REQ-010-AC-01).
 * Colour is freeform and is the only truly optional mutable field. When
 * omitted, it is stored as an empty string so the record still reflects
 * exactly the data provided in the request.
 *
 * @param {Object} params
 * @param {string} [params.name]
 * @param {number} [params.age]
 * @param {string} [params.colour]
 */
function assertBearInput({ name, age, colour }) {
  if (!isPresentString(name)) {
    throw new ValidationError("name is required");
  }

  if (name.length > 100) {
    throw new ValidationError("name must be no more than 100 characters");
  }

  if (!NAME_PATTERN.test(name)) {
    throw new ValidationError("name contains invalid characters");
  }

  if (!Number.isInteger(age)) {
    throw new ValidationError("age must be an integer");
  }

  if (age < 0) {
    throw new ValidationError("age must be non-negative");
  }

  // Colour is freeform and may be absent (defaults to "" at the service
  // layer). Treat absent as acceptable here so callers can omit it; any
  // provided value must still be a string.
  if (colour !== undefined && typeof colour !== "string") {
    throw new ValidationError("colour must be a string");
  }
}

module.exports = {
  buildBear,
  assertBearInput,
  NAME_PATTERN,
};
