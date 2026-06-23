const { test, describe } = require("node:test");
const assert = require("node:assert");
const { buildOrganization, assertCreatableInput, assertReplaceableInput } = require("./organization");
const { ValidationError } = require("./errors");

describe("buildOrganization", () => {
  test("returns exactly id, name, and slug", () => {
    const org = buildOrganization({ id: "1", name: "Acme", slug: "acme", extra: "ignored" });

    assert.deepStrictEqual(org, { id: "1", name: "Acme", slug: "acme" });
    assert.deepStrictEqual(Object.keys(org).sort(), ["id", "name", "slug"]);
  });
});

describe("assertCreatableInput", () => {
  test("accepts valid input", () => {
    assert.doesNotThrow(() => assertCreatableInput({ name: "Acme", slug: "acme" }));
  });

  test("rejects missing name", () => {
    assert.throws(() => assertCreatableInput({ slug: "acme" }), ValidationError);
  });

  test("rejects missing slug", () => {
    assert.throws(() => assertCreatableInput({ name: "Acme" }), ValidationError);
  });

  test("rejects empty name", () => {
    assert.throws(() => assertCreatableInput({ name: "", slug: "acme" }), ValidationError);
  });

  test("rejects empty slug", () => {
    assert.throws(() => assertCreatableInput({ name: "Acme", slug: "" }), ValidationError);
  });

  test("rejects invalid slug format", () => {
    assert.throws(() => assertCreatableInput({ name: "Acme", slug: "Acme Corp" }), ValidationError);
    assert.throws(() => assertCreatableInput({ name: "Acme", slug: "acme_" }), ValidationError);
    assert.throws(() => assertCreatableInput({ name: "Acme", slug: "-acme" }), ValidationError);
    assert.throws(() => assertCreatableInput({ name: "Acme", slug: "acme--corp" }), ValidationError);
  });
});

describe("assertReplaceableInput", () => {
  test("accepts valid input", () => {
    assert.doesNotThrow(() => assertReplaceableInput({ id: "1", name: "Acme", slug: "acme" }));
  });

  test("rejects missing id", () => {
    assert.throws(() => assertReplaceableInput({ name: "Acme", slug: "acme" }), ValidationError);
  });

  test("rejects invalid slug format", () => {
    assert.throws(() => assertReplaceableInput({ id: "1", name: "Acme", slug: "Acme Corp" }), ValidationError);
  });
});
