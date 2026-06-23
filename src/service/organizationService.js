const { randomUUID } = require("node:crypto");
const { buildOrganization, assertCreatableInput, assertReplaceableInput } = require("../domain/organization");
const { ValidationError, ConflictError, NotFoundError } = require("../domain/errors");

/**
 * Create the organization service.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../store/organizationStore").createOrganizationStore>} deps.store
 * @param {() => string} [deps.generateId]
 */
function createOrganizationService({ store, generateId = randomUUID }) {
  function createOrganization(input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { name, slug } = input;
    assertCreatableInput({ name, slug });

    if (store.getBySlug(slug)) {
      throw new ConflictError("Slug already in use");
    }

    const organization = buildOrganization({ id: generateId(), name, slug });
    store.insert(organization);
    return organization;
  }

  function replaceOrganization(pathId, input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { id: bodyId, name, slug } = input;
    assertReplaceableInput({ id: bodyId, name, slug });

    if (bodyId !== pathId) {
      throw new ValidationError("id in body does not match path id");
    }

    if (!store.has(pathId)) {
      throw new NotFoundError("Organization not found");
    }

    const existingWithSlug = store.getBySlug(slug);
    if (existingWithSlug && existingWithSlug.id !== pathId) {
      throw new ConflictError("Slug already in use");
    }

    const organization = buildOrganization({ id: pathId, name, slug });
    store.replace(organization);
    return organization;
  }

  return { createOrganization, replaceOrganization };
}

module.exports = { createOrganizationService };
