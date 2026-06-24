const { v7: uuidv7 } = require("uuid");
const {
  buildOfficeTable,
  isUuidV7,
  assertCreatableInput,
  assertReplaceableInput,
} = require("../domain/officeTable");
const { ValidationError, NotFoundError } = require("../domain/errors");
const { decodeCursor } = require("../store/officeTable");

/**
 * Create the office table service.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../store/officeTable").createOfficeTableStore>} deps.store
 * @param {() => string} [deps.generateId]
 */
function createOfficeTableService({ store, generateId = uuidv7 }) {
  function createOfficeTable(input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { price, dateBought } = input;
    assertCreatableInput({ price, dateBought });

    const table = buildOfficeTable({
      id: generateId(),
      price,
      dateBought,
    });

    store.insert(table);
    return table;
  }

  function getOfficeTable(id) {
    if (!isUuidV7(id)) {
      throw new ValidationError("Invalid office table id");
    }

    const table = store.get(id);
    if (!table) {
      throw new NotFoundError("Office table not found");
    }

    return table;
  }

  function listOfficeTables({ cursor, limit } = {}) {
    const parsedLimit = parseLimit(limit);
    const afterId = cursor ? decodeCursor(cursor).id : undefined;

    return store.list({ afterId, limit: parsedLimit });
  }

  function replaceOfficeTable(pathId, input) {
    if (!isUuidV7(pathId)) {
      throw new ValidationError("Invalid office table id");
    }

    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { price, dateBought } = input;
    assertReplaceableInput({ price, dateBought });

    if (!store.has(pathId)) {
      throw new NotFoundError("Office table not found");
    }

    const table = buildOfficeTable({ id: pathId, price, dateBought });
    store.replace(table);
    return table;
  }

  function deleteOfficeTable(id) {
    if (!isUuidV7(id)) {
      throw new ValidationError("Invalid office table id");
    }

    if (!store.has(id)) {
      throw new NotFoundError("Office table not found");
    }

    store.delete(id);
  }

  return {
    createOfficeTable,
    getOfficeTable,
    listOfficeTables,
    replaceOfficeTable,
    deleteOfficeTable,
  };
}

const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function parseLimit(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < MIN_LIMIT || parsed > MAX_LIMIT) {
    throw new ValidationError("limit must be an integer between 1 and 100");
  }

  return parsed;
}

module.exports = { createOfficeTableService };
