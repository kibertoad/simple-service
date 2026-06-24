const { test, describe } = require("node:test");
const assert = require("node:assert");
const { createBearStore } = require("./bearStore");

describe("createBearStore", () => {
  test("inserts and retrieves a bear by id", () => {
    const store = createBearStore();
    const bear = { id: "1", name: "Paddington", age: 5, colour: "brown" };

    store.insert(bear);

    assert.deepStrictEqual(store.get("1"), bear);
    assert.strictEqual(store.has("1"), true);
  });

  test("retrieves a bear by name", () => {
    const store = createBearStore();
    const bear = { id: "1", name: "Paddington", age: 5, colour: "brown" };

    store.insert(bear);

    assert.deepStrictEqual(store.getByName("Paddington"), bear);
  });

  test("replace updates the name index", () => {
    const store = createBearStore();
    store.insert({ id: "1", name: "Paddington", age: 5, colour: "brown" });

    store.replace({ id: "1", name: "Pooh", age: 6, colour: "yellow" });

    assert.strictEqual(store.getByName("Paddington"), undefined);
    assert.deepStrictEqual(store.getByName("Pooh"), { id: "1", name: "Pooh", age: 6, colour: "yellow" });
  });

  test("delete removes both indexes", () => {
    const store = createBearStore();
    store.insert({ id: "1", name: "Paddington", age: 5, colour: "brown" });

    store.delete("1");

    assert.strictEqual(store.has("1"), false);
    assert.strictEqual(store.getByName("Paddington"), undefined);
  });

  test("list returns empty paginated result when store is empty", () => {
    const store = createBearStore();

    const result = store.list();

    assert.deepStrictEqual(result, { data: [], nextCursor: null });
  });

  test("list paginates by id ascending", () => {
    const store = createBearStore();
    const bearA = { id: "a", name: "A", age: 1, colour: "" };
    const bearB = { id: "b", name: "B", age: 2, colour: "" };
    const bearC = { id: "c", name: "C", age: 3, colour: "" };
    store.insert(bearB);
    store.insert(bearA);
    store.insert(bearC);

    const page1 = store.list({ limit: 2 });

    assert.deepStrictEqual(page1.data, [bearA, bearB]);
    assert.strictEqual(typeof page1.nextCursor, "string");

    const page2 = store.list({ cursor: page1.nextCursor, limit: 2 });

    assert.deepStrictEqual(page2.data, [bearC]);
    assert.strictEqual(page2.nextCursor, null);
  });

  test("list returns null nextCursor when fewer than limit remain", () => {
    const store = createBearStore();
    store.insert({ id: "a", name: "A", age: 1, colour: "" });

    const result = store.list({ limit: 5 });

    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.nextCursor, null);
  });

  test("list skips ids at or before cursor", () => {
    const store = createBearStore();
    const bearA = { id: "a", name: "A", age: 1, colour: "" };
    const bearB = { id: "b", name: "B", age: 2, colour: "" };
    store.insert(bearA);
    store.insert(bearB);

    const result = store.list({ cursor: store._encodeCursor(bearA), limit: 10 });

    assert.deepStrictEqual(result.data, [bearB]);
    assert.strictEqual(result.nextCursor, null);
  });

  test("list handles stale cursor gracefully", () => {
    const store = createBearStore();
    const bearA = { id: "a", name: "A", age: 1, colour: "" };
    const bearB = { id: "b", name: "B", age: 2, colour: "" };
    store.insert(bearA);
    store.insert(bearB);
    store.delete("a");

    const result = store.list({ cursor: store._encodeCursor(bearA), limit: 10 });

    assert.deepStrictEqual(result.data, [bearB]);
    assert.strictEqual(result.nextCursor, null);
  });
});
