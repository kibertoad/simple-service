"use strict";

/**
 * Per-resource schemas for the `/echo` endpoint.
 *
 * The EchoSchema defines the inbound POST body contract. It is `.strict()`,
 * so unknown keys are rejected rather than silently dropped — this matches the
 * agreed default for inbound JSON payloads.
 */

const { z } = require("zod");
const { textSchema } = require("./primitives");

/**
 * Inbound body for `POST /echo`.
 *
 * @typedef {z.infer<typeof EchoBodySchema>} EchoBody
 */
const EchoBodySchema = z
  .object({
    /** Message to echo back. Non-empty after trimming, bounded in length. */
    message: textSchema(4096, "Message").min(1, "Message is required"),
    /**
     * Optional arbitrary metadata. Kept as a record of strings to bound depth
     * and avoid accepting unbounded nested structures. Key count is capped.
     */
    meta: z
      .record(z.string(), z.string())
      .refine((rec) => Object.keys(rec).length <= 20, {
        message: "Metadata supports at most 20 keys",
      })
      .optional(),
  })
  .strict();

module.exports = {
  EchoBodySchema,
};
