const { test, describe } = require("node:test");
const assert = require("node:assert");
const { buildUser, assertCreatableInput, assertReplaceableInput } = require("./user");
const { ValidationError } = require("./errors");

describe("buildUser", () => {
  test("returns exactly id, name, and email", () => {
    const user = buildUser({ id: "1", name: "Alice", email: "alice@example.com", extra: "ignored" });

    assert.deepStrictEqual(user, { id: "1", name: "Alice", email: "alice@example.com" });
    assert.deepStrictEqual(Object.keys(user).sort(), ["email", "id", "name"]);
  });
});

describe("assertCreatableInput", () => {
  test("accepts valid input", () => {
    assert.doesNotThrow(() => assertCreatableInput({ name: "Alice", email: "alice@example.com" }));
  });

  test("rejects missing name", () => {
    assert.throws(() => assertCreatableInput({ email: "alice@example.com" }), ValidationError);
  });

  test("rejects missing email", () => {
    assert.throws(() => assertCreatableInput({ name: "Alice" }), ValidationError);
  });

  test("rejects empty name", () => {
    assert.throws(() => assertCreatableInput({ name: "", email: "alice@example.com" }), ValidationError);
  });

  test("rejects empty email", () => {
    assert.throws(() => assertCreatableInput({ name: "Alice", email: "" }), ValidationError);
  });
});

describe("assertReplaceableInput", () => {
  test("accepts valid input", () => {
    assert.doesNotThrow(() => assertReplaceableInput({ id: "1", name: "Alice", email: "alice@example.com" }));
  });

  test("rejects missing id", () => {
    assert.throws(() => assertReplaceableInput({ name: "Alice", email: "alice@example.com" }), ValidationError);
  });
});
