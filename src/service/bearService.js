const { v7: uuidv7 } = require("uuid");
const { buildBear, assertBearInput } = require("../domain/bear");
const { ValidationError, ConflictError, NotFoundError } = require("../domain/errors");

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function sanitizeLimit(limit) {
  if (limit === undefined || limit === "") {
    return DEFAULT_LIMIT;
  }
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError("limit must be a positive integer");
  }
  return Math.min(parsed, MAX_LIMIT);
}

/**
 * Create the bear service.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../store/bearStore").createBearStore>} deps.store
 * @param {() => string} [deps.generateId]
 */
function createBearService({ store, generateId = uuidv7 }) {
  function createBear(input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { name, age, colour = "" } = input;
    assertBearInput({ name, age, colour });

    if (store.getByName(name)) {
      throw new ConflictError("Name already in use");
    }

    const bear = buildBear({ id: generateId(), name, age, colour });
    store.insert(bear);
    return bear;
  }

  function getBear(id) {
    const bear = store.get(id);
    if (!bear) {
      throw new NotFoundError("Bear not found");
    }
    return bear;
  }

  function listBears({ cursor, limit } = {}) {
    const pageLimit = sanitizeLimit(limit);
    return store.list({ cursor, limit: pageLimit });
  }

  function updateBear(pathId, input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { name, age, colour = "" } = input;
    assertBearInput({ name, age, colour });

    if (!store.has(pathId)) {
      throw new NotFoundError("Bear not found");
    }

    const existingWithName = store.getByName(name);
    if (existingWithName && existingWithName.id !== pathId) {
      throw new ConflictError("Name already in use");
    }

    const bear = buildBear({ id: pathId, name, age, colour });
    store.replace(bear);
    return bear;
  }

  function deleteBear(id) {
    if (!store.has(id)) {
      throw new NotFoundError("Bear not found");
    }
    store.delete(id);
  }

  return { createBear, getBear, listBears, updateBear, deleteBear };
}

module.exports = { createBearService, DEFAULT_LIMIT, MAX_LIMIT };
