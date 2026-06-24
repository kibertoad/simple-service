const { test, describe } = require("node:test");
const assert = require("node:assert");
const { buildBear, assertBearInput, NAME_PATTERN } = require("./bear");
const { ValidationError } = require("./errors");

describe("buildBear", () => {
  test("returns exactly id, name, age, and colour", () => {
    const bear = buildBear({
      id: "1",
      name: "Paddington",
      age: 5,
      colour: "brown",
      extra: "ignored",
    });

    assert.deepStrictEqual(bear, { id: "1", name: "Paddington", age: 5, colour: "brown" });
    assert.deepStrictEqual(Object.keys(bear).sort(), ["age", "colour", "id", "name"]);
  });
});

describe("assertBearInput", () => {
  test("accepts valid input with all fields", () => {
    assert.doesNotThrow(() => assertBearInput({ name: "Paddington", age: 5, colour: "brown" }));
  });

  test("accepts valid input when colour is omitted", () => {
    assert.doesNotThrow(() => assertBearInput({ name: "Paddington", age: 5 }));
  });

  test("accepts valid input when colour is an empty string", () => {
    assert.doesNotThrow(() => assertBearInput({ name: "Paddington", age: 5, colour: "" }));
  });

  test("rejects missing name", () => {
    assert.throws(() => assertBearInput({ age: 5 }), ValidationError);
  });

  test("rejects empty name", () => {
    assert.throws(() => assertBearInput({ name: "", age: 5 }), ValidationError);
  });

  test("rejects whitespace-only name", () => {
    assert.throws(() => assertBearInput({ name: "   ", age: 5 }), ValidationError);
  });

  test("rejects name longer than 100 characters", () => {
    const longName = "A".repeat(101);
    assert.throws(() => assertBearInput({ name: longName, age: 5 }), ValidationError);
  });

  test("accepts name of exactly 100 characters", () => {
    const name = "A".repeat(100);
    assert.doesNotThrow(() => assertBearInput({ name, age: 5 }));
  });

  test("rejects name with invalid characters", () => {
    assert.throws(() => assertBearInput({ name: "Paddington@Home", age: 5 }), ValidationError);
  });

  test("rejects negative age", () => {
    assert.throws(() => assertBearInput({ name: "Paddington", age: -1 }), ValidationError);
  });

  test("rejects fractional age", () => {
    assert.throws(() => assertBearInput({ name: "Paddington", age: 5.5 }), ValidationError);
  });

  test("rejects string age", () => {
    assert.throws(() => assertBearInput({ name: "Paddington", age: "5" }), ValidationError);
  });

  test("rejects boolean age", () => {
    assert.throws(() => assertBearInput({ name: "Paddington", age: true }), ValidationError);
  });

  test("rejects null age", () => {
    assert.throws(() => assertBearInput({ name: "Paddington", age: null }), ValidationError);
  });

  test("rejects non-string colour", () => {
    assert.throws(() => assertBearInput({ name: "Paddington", age: 5, colour: 123 }), ValidationError);
  });
});
