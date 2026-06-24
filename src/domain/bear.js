const { ValidationError } = require("./errors");

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
 * Colour is accepted as provided (freeform), defaulting to an empty
 * string when omitted so the request can still be "exactly provided".
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

  // colour is freeform and may be absent; treat absent as "" so callers can
  // omit it without triggering a validation error, while still storing exactly
  // the provided data.
  if (colour !== undefined && typeof colour !== "string") {
    throw new ValidationError("colour must be a string");
  }
}

module.exports = {
  buildBear,
  assertBearInput,
  NAME_PATTERN,
};
