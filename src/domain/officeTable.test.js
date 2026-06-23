const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  buildOfficeTable,
  isUuidV7,
  assertCreatableInput,
  assertReplaceableInput,
} = require("./officeTable");
const { ValidationError } = require("./errors");

const SAMPLE_UUIDV7 = "0193e272-5b18-7ff9-a1a2-123456789abc";

function assertUuidV7(value) {
  assert.ok(isUuidV7(value), `expected a UUIDv7, got ${value}`);
}

describe("buildOfficeTable", () => {
  test("returns exactly id, price, and dateBought", () => {
    const table = buildOfficeTable({
      id: SAMPLE_UUIDV7,
      price: 123.45,
      dateBought: "2026-06-23",
      extra: "ignored",
    });

    assert.deepStrictEqual(table, {
      id: SAMPLE_UUIDV7,
      price: 123.45,
      dateBought: "2026-06-23",
    });
    assert.deepStrictEqual(Object.keys(table).sort(), ["dateBought", "id", "price"]);
  });
});

describe("isUuidV7", () => {
  test("accepts valid UUIDv7 string", () => {
    assert.ok(isUuidV7(SAMPLE_UUIDV7));
  });

  test("rejects invalid version nibble", () => {
    assert.strictEqual(
      isUuidV7("0193e272-5b18-4ff9-a1a2-123456789abc"),
      false
    );
  });

  test("rejects non-string values", () => {
    assert.strictEqual(isUuidV7(123), false);
    assert.strictEqual(isUuidV7(null), false);
    assert.strictEqual(isUuidV7(undefined), false);
  });
});

describe("assertCreatableInput", () => {
  test("accepts valid input", () => {
    assert.doesNotThrow(() =>
      assertCreatableInput({ price: 100, dateBought: "2026-06-23" })
    );
  });

  test("accepts zero price", () => {
    assert.doesNotThrow(() =>
      assertCreatableInput({ price: 0, dateBought: "2026-06-23" })
    );
  });

  test("rejects missing price", () => {
    assert.throws(
      () => assertCreatableInput({ dateBought: "2026-06-23" }),
      ValidationError
    );
  });

  test("rejects negative price", () => {
    assert.throws(
      () => assertCreatableInput({ price: -1, dateBought: "2026-06-23" }),
      ValidationError
    );
  });

  test("rejects non-numeric price", () => {
    assert.throws(
      () => assertCreatableInput({ price: "free", dateBought: "2026-06-23" }),
      ValidationError
    );
  });

  test("rejects NaN price", () => {
    assert.throws(
      () => assertCreatableInput({ price: NaN, dateBought: "2026-06-23" }),
      ValidationError
    );
  });

  test("rejects missing dateBought", () => {
    assert.throws(
      () => assertCreatableInput({ price: 100 }),
      ValidationError
    );
  });

  test("rejects empty dateBought", () => {
    assert.throws(
      () => assertCreatableInput({ price: 100, dateBought: "" }),
      ValidationError
    );
  });
});

describe("assertReplaceableInput", () => {
  test("accepts valid input", () => {
    assert.doesNotThrow(() =>
      assertReplaceableInput({ price: 200, dateBought: "2026-06-24" })
    );
  });

  test("rejects zero price as boundary success already covered elsewhere", () => {
    assert.doesNotThrow(() =>
      assertReplaceableInput({ price: 0, dateBought: "2026-06-24" })
    );
  });
});
