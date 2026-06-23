const { ValidationError } = require("./errors");

/**
 * Build a persisted Organization object with exactly the allowed fields.
 * This deliberately ignores any extra keys from the input object.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.name
 * @param {string} params.slug
 * @returns {{id: string, name: string, slug: string}}
 */
function buildOrganization({ id, name, slug }) {
  return { id, name, slug };
}

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertCreatableInput({ name, slug }) {
  if (!isPresent(name)) {
    throw new ValidationError("name is required");
  }
  if (!isPresent(slug)) {
    throw new ValidationError("slug is required");
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new ValidationError("slug must be lowercase alphanumeric separated by hyphens");
  }
}

function assertReplaceableInput({ id, name, slug }) {
  if (!isPresent(id)) {
    throw new ValidationError("id is required");
  }
  if (!isPresent(name)) {
    throw new ValidationError("name is required");
  }
  if (!isPresent(slug)) {
    throw new ValidationError("slug is required");
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new ValidationError("slug must be lowercase alphanumeric separated by hyphens");
  }
}

module.exports = {
  buildOrganization,
  assertCreatableInput,
  assertReplaceableInput,
};
