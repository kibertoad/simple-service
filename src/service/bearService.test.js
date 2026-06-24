const { test, describe } = require("node:test");
const assert = require("node:assert");
const { createBearService } = require("./bearService");
const { createBearStore } = require("../store/bearStore");
const { ValidationError, NotFoundError, ConflictError } = require("../domain/errors");

describe("createBearService", () => {
  test("createBear persists a bear with generated id", () => {
    const store = createBearStore();
    const service = createBearService({ store, generateId: () => "id-1" });

    const bear = service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    assert.deepStrictEqual(bear, { id: "id-1", name: "Paddington", age: 5, colour: "brown" });
    assert.deepStrictEqual(store.get("id-1"), bear);
  });

  test("createBear defaults colour to empty string", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });

    const bear = service.createBear({ name: "Paddington", age: 5 });

    assert.strictEqual(bear.colour, "");
  });

  test("createBear discards extra fields", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });

    const bear = service.createBear({ id: "ignore", name: "Paddington", age: 5, colour: "brown", extra: "drop" });

    assert.deepStrictEqual(Object.keys(bear).sort(), ["age", "colour", "id", "name"]);
    assert.strictEqual(bear.id, "id-1");
  });

  test("createBear rejects duplicate name", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    assert.throws(
      () => service.createBear({ name: "Paddington", age: 3, colour: "black" }),
      ConflictError
    );
  });

  test("getBear returns the stored bear", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    const created = service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    const bear = service.getBear("id-1");

    assert.deepStrictEqual(bear, created);
  });

  test("getBear throws NotFoundError for missing id", () => {
    const service = createBearService({ store: createBearStore() });

    assert.throws(() => service.getBear("missing"), NotFoundError);
  });

  test("listBears returns paginated data", () => {
    const store = createBearStore();
    const service = createBearService({ store, generateId: () => "id-1" });
    const bear = service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    const result = service.listBears();

    assert.deepStrictEqual(result.data, [bear]);
    assert.strictEqual(result.nextCursor, null);
  });

  test("listBears enforces max limit", () => {
    const service = createBearService({ store: createBearStore() });

    // No need to seed; just verify limit is capped through store.list delegation.
    const result = service.listBears({ limit: 500 });
    assert.strictEqual(result.data.length, 0);
    assert.strictEqual(result.nextCursor, null);
  });

  test("listBears rejects invalid limit", () => {
    const service = createBearService({ store: createBearStore() });

    assert.throws(() => service.listBears({ limit: -1 }), ValidationError);
    assert.throws(() => service.listBears({ limit: "abc" }), ValidationError);
  });

  test("updateBear fully replaces mutable fields", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    const bear = service.updateBear("id-1", { name: "Pooh", age: 10, colour: "yellow" });

    assert.deepStrictEqual(bear, { id: "id-1", name: "Pooh", age: 10, colour: "yellow" });
  });

  test("updateBear keeps id immutable and ignores body id", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    const bear = service.updateBear("id-1", { id: "id-999", name: "Pooh", age: 10, colour: "yellow" });

    assert.strictEqual(bear.id, "id-1");
  });

  test("updateBear allows keeping own name", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    const bear = service.updateBear("id-1", { name: "Paddington", age: 6, colour: "red" });

    assert.deepStrictEqual(bear, { id: "id-1", name: "Paddington", age: 6, colour: "red" });
  });

  test("updateBear rejects duplicate name held by another bear", () => {
    const store = createBearStore();
    let counter = 0;
    const service = createBearService({ store, generateId: () => `id-${++counter}` });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });
    service.createBear({ name: "Pooh", age: 10, colour: "yellow" });

    assert.throws(
      () => service.updateBear("id-2", { name: "Paddington", age: 10, colour: "yellow" }),
      ConflictError
    );
  });

  test("updateBear rejects missing bear", () => {
    const service = createBearService({ store: createBearStore() });

    assert.throws(
      () => service.updateBear("missing", { name: "Paddington", age: 5, colour: "brown" }),
      NotFoundError
    );
  });

  test("updateBear rejects invalid age", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    assert.throws(
      () => service.updateBear("id-1", { name: "Paddington", age: -1, colour: "brown" }),
      ValidationError
    );
  });

  test("updateBear rejects empty name", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    assert.throws(
      () => service.updateBear("id-1", { name: "", age: 5, colour: "brown" }),
      ValidationError
    );
  });

  test("updateBear updates name index", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    service.updateBear("id-1", { name: "Pooh", age: 6, colour: "yellow" });

    assert.strictEqual(service.getBear("id-1").name, "Pooh");
  });

  test("deleteBear removes the bear", () => {
    const service = createBearService({ store: createBearStore(), generateId: () => "id-1" });
    service.createBear({ name: "Paddington", age: 5, colour: "brown" });

    service.deleteBear("id-1");

    assert.throws(() => service.getBear("id-1"), NotFoundError);
  });

  test("deleteBear throws NotFoundError for missing id", () => {
    const service = createBearService({ store: createBearStore() });

    assert.throws(() => service.deleteBear("missing"), NotFoundError);
  });
});
