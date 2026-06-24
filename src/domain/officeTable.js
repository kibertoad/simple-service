const { ValidationError } = require("./errors");

/**
 * Build a persisted Office Table object with exactly the allowed fields.
 * This deliberately ignores any extra keys from the input object.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {number} params.price
 * @param {string} params.dateBought
 * @returns {{id: string, price: number, dateBought: string}}
 */
function buildOfficeTable({ id, price, dateBought }) {
  return { id, price, dateBought };
}

const UUIDV7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidV7(value) {
  return typeof value === "string" && UUIDV7_RE.test(value);
}

function isPresentString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidPrice(value) {
  return typeof value === "number" && Number.isFinite(value) && !Number.isNaN(value);
}

function assertPrice(value) {
  if (!isValidPrice(value)) {
    throw new ValidationError("price must be a finite number");
  }
  if (value < 0) {
    throw new ValidationError("price must be non-negative");
  }
}

function assertCreatableInput({ price, dateBought }) {
  assertPrice(price);
  if (!isPresentString(dateBought)) {
    throw new ValidationError("dateBought is required");
  }
}

function assertReplaceableInput({ price, dateBought }) {
  assertPrice(price);
  if (!isPresentString(dateBought)) {
    throw new ValidationError("dateBought is required");
  }
}

module.exports = {
  buildOfficeTable,
  isUuidV7,
  assertCreatableInput,
  assertReplaceableInput,
};
