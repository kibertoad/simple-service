"use strict";

/**
 * Barrel export for the schema registry.
 *
 * Import schemas from here (e.g. `const { EchoBodySchema } = require("./schemas")`)
 * rather than reaching into individual files. Schemas are constructed once at
 * module load and reused across requests — do not rebuild them per request.
 */

const {
  emailSchema,
  idSchema,
  textSchema,
  timestampSchema,
  paginationSchema,
} = require("./primitives");
const { EchoBodySchema } = require("./echo");

module.exports = {
  // primitives
  emailSchema,
  idSchema,
  textSchema,
  timestampSchema,
  paginationSchema,
  // per-resource
  EchoBodySchema,
};
