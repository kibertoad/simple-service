"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  emailSchema,
  idSchema,
  textSchema,
  timestampSchema,
  paginationSchema,
} = require("../src/schemas/primitives");
const { validate, validateOrThrow, ValidationError } = require("../src/validation");

// ---------------------------------------------------------------------------
// emailSchema
// ---------------------------------------------------------------------------
test("emailSchema accepts a normal email and normalizes case + trim", () => {
  const result = emailSchema.safeParse("  Alice@Example.COM ");
  assert.equal(result.success, true);
  assert.equal(result.data, "alice@example.com");
});

test("emailSchema rejects a missing local part", () => {
  const result = emailSchema.safeParse("@example.com");
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].code, "invalid_string");
});

test("emailSchema rejects an overly long email", () => {
  const long = "a".repeat(300) + "@example.com";
  const result = emailSchema.safeParse(long);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].code, "too_big");
});

test("emailSchema rejects non-strings", () => {
  const result = emailSchema.safeParse(42);
  assert.equal(result.success, false);
});

// ---------------------------------------------------------------------------
// idSchema
// ---------------------------------------------------------------------------
test("idSchema accepts UUIDs and slugs", () => {
  for (const id of ["550e8400-e29b-41d4-a716-446655440000", "user_42", "abc-XYZ"]) {
    const result = idSchema.safeParse(id);
    assert.equal(result.success, true, `expected ${id} to be valid`);
  }
});

test("idSchema rejects empty and disallowed characters", () => {
  assert.equal(idSchema.safeParse("").success, false);
  assert.equal(idSchema.safeParse("has space").success, false);
  assert.equal(idSchema.safeParse("bad/char").success, false);
});

test("idSchema rejects ids longer than 64 chars", () => {
  assert.equal(idSchema.safeParse("a".repeat(65)).success, false);
});

// ---------------------------------------------------------------------------
// textSchema
// ---------------------------------------------------------------------------
test("textSchema trims and enforces a max length", () => {
  const schema = textSchema(5, "Name");
  assert.equal(schema.safeParse("  ok  ").data, "ok");
  assert.equal(schema.safeParse("too long").success, false);
});

test("textSchema throws on a non-positive max", () => {
  assert.throws(() => textSchema(0), /positive integer/);
  assert.throws(() => textSchema(1.5), /positive integer/);
});

// ---------------------------------------------------------------------------
// timestampSchema
// ---------------------------------------------------------------------------
test("timestampSchema accepts ISO-8601 forms", () => {
  for (const ts of ["2024-01-02", "2024-01-02T03:04:05Z", "2024-01-02T03:04:05.123+02:00"]) {
    assert.equal(timestampSchema.safeParse(ts).success, true, `expected ${ts} valid`);
  }
});

test("timestampSchema rejects garbage", () => {
  assert.equal(timestampSchema.safeParse("not-a-date").success, false);
  assert.equal(timestampSchema.safeParse("2024/01/02").success, false);
});

// ---------------------------------------------------------------------------
// paginationSchema (coercion + defaults)
// ---------------------------------------------------------------------------
test("paginationSchema applies defaults for missing params", () => {
  const result = paginationSchema.safeParse({});
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { page: 1, limit: 20 });
});

test("paginationSchema coerces string params from query strings", () => {
  const result = paginationSchema.safeParse({ page: "3", limit: "5" });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { page: 3, limit: 5 });
});

test("paginationSchema rejects non-positive and over-limit values", () => {
  assert.equal(paginationSchema.safeParse({ page: 0 }).success, false);
  assert.equal(paginationSchema.safeParse({ limit: 101 }).success, false);
  assert.equal(paginationSchema.safeParse({ limit: "abc" }).success, false);
});

test("paginationSchema is strict about unknown keys", () => {
  assert.equal(paginationSchema.safeParse({ page: 1, sort: "asc" }).success, false);
});

// ---------------------------------------------------------------------------
// validate() helper + error mapping
// ---------------------------------------------------------------------------
test("validate returns success:false with a ValidationError on bad payload", () => {
  const result = validate(emailSchema, "not-an-email");
  assert.equal(result.success, false);
  assert.ok(result.error instanceof ValidationError);
  assert.equal(result.error.status, 400);
  assert.equal(result.error.code, "VALIDATION_ERROR");
  assert.ok(Array.isArray(result.error.issues));
  assert.ok(result.error.issues[0].path !== undefined);
});

test("validate returns success:true with parsed data on good payload", () => {
  const result = validate(emailSchema, "ok@example.com");
  assert.equal(result.success, true);
  assert.equal(result.data, "ok@example.com");
});

test("ValidationError.toJSON produces a client-safe envelope", () => {
  const result = validate(emailSchema, "bad");
  const json = result.error.toJSON();
  assert.deepEqual(Object.keys(json).sort(), ["code", "issues", "message", "status"]);
  assert.equal(json.status, 400);
  assert.equal(json.code, "VALIDATION_ERROR");
  assert.deepEqual(Object.keys(json.issues[0]).sort(), ["code", "message", "path"]);
});

test("validateOrThrow returns data on success and throws ValidationError on failure", () => {
  const data = validateOrThrow(emailSchema, "ok@example.com");
  assert.equal(data, "ok@example.com");
  assert.throws(
    () => validateOrThrow(emailSchema, "bad"),
    (err) => err instanceof ValidationError
  );
});
