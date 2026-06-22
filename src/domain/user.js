const { ValidationError } = require("./errors");

/**
 * Build a persisted User object with exactly the allowed fields.
 * This deliberately ignores any extra keys from the input object.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.name
 * @param {string} params.email
 * @returns {{id: string, name: string, email: string}}
 */
function buildUser({ id, name, email }) {
  return { id, name, email };
}

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertCreatableInput({ name, email }) {
  if (!isPresent(name)) {
    throw new ValidationError("name is required");
  }
  if (!isPresent(email)) {
    throw new ValidationError("email is required");
  }
}

function assertReplaceableInput({ id, name, email }) {
  if (!isPresent(id)) {
    throw new ValidationError("id is required");
  }
  if (!isPresent(name)) {
    throw new ValidationError("name is required");
  }
  if (!isPresent(email)) {
    throw new ValidationError("email is required");
  }
}

module.exports = {
  buildUser,
  assertCreatableInput,
  assertReplaceableInput,
};
