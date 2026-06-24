const { test, describe } = require("node:test");
const assert = require("node:assert");
const { createOfficeTableService } = require("./officeTableService");
const { createOfficeTableStore } = require("../store/officeTable");
const { ValidationError, NotFoundError } = require("../domain/errors");

const UUIDV7_A = "0193e272-5b18-7ff9-a1a2-123456789abc";
const UUIDV7_B = "0193e272-7a11-7ff9-a1a2-123456789abc";

function isUuidV7(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

describe("createOfficeTableService", () => {
  test("creates an office table with generated UUIDv7", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });

    const table = service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    assert.deepStrictEqual(table, { id: UUIDV7_A, price: 100, dateBought: "2026-06-23" });
    assert.deepStrictEqual(store.get(UUIDV7_A), table);
  });

  test("ignores client-supplied id on create", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });

    const table = service.createOfficeTable({
      id: "not-an-id",
      price: 100,
      dateBought: "2026-06-23",
    });

    assert.strictEqual(table.id, UUIDV7_A);
    assert.strictEqual(store.get("not-an-id"), undefined);
  });

  test("distinct ids for independent creates", () => {
    const store = createOfficeTableStore();
    let counter = 0;
    const service = createOfficeTableService({
      store,
      generateId: () => `0193e272-5b18-7${++counter}f9-a1a2-123456789abc`,
    });

    const a = service.createOfficeTable({ price: 1, dateBought: "2026-06-23" });
    const b = service.createOfficeTable({ price: 2, dateBought: "2026-06-24" });

    assert.notStrictEqual(a.id, b.id);
  });

  test("rejects negative price on create", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(
      () => service.createOfficeTable({ price: -10, dateBought: "2026-06-23" }),
      ValidationError
    );
    assert.strictEqual(store.list().items.length, 0);
  });

  test("zero price is allowed on create", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });

    const table = service.createOfficeTable({ price: 0, dateBought: "2026-06-23" });

    assert.deepStrictEqual(table.price, 0);
    assert.deepStrictEqual(store.get(UUIDV7_A), table);
  });

  test("getOfficeTable returns stored table", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    const table = service.getOfficeTable(UUIDV7_A);

    assert.deepStrictEqual(table, { id: UUIDV7_A, price: 100, dateBought: "2026-06-23" });
  });

  test("getOfficeTable throws for malformed id", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(() => service.getOfficeTable("not-a-uuid"), ValidationError);
    assert.throws(() => service.getOfficeTable("550e8400-e29b-41d4-a716-446655440000"), ValidationError);
  });

  test("getOfficeTable throws 404 for missing id", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(
      () => service.getOfficeTable("0193e272-5b18-7ff9-a1a2-123456789def"),
      NotFoundError
    );
  });

  test("replaceOfficeTable fully replaces existing table", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    const table = service.replaceOfficeTable(UUIDV7_A, { price: 200, dateBought: "2026-07-01" });

    assert.deepStrictEqual(table, { id: UUIDV7_A, price: 200, dateBought: "2026-07-01" });
    assert.deepStrictEqual(store.get(UUIDV7_A), table);
  });

  test("replaceOfficeTable ignores any id in request body", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    const table = service.replaceOfficeTable(UUIDV7_A, {
      id: UUIDV7_B,
      price: 200,
      dateBought: "2026-07-01",
    });

    assert.strictEqual(table.id, UUIDV7_A);
    assert.deepStrictEqual(store.get(UUIDV7_A), table);
    assert.strictEqual(store.get(UUIDV7_B), undefined);
  });

  test("replaceOfficeTable rejects negative price and does not persist", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    assert.throws(
      () => service.replaceOfficeTable(UUIDV7_A, { price: -5, dateBought: "2026-07-01" }),
      ValidationError
    );
    assert.deepStrictEqual(store.get(UUIDV7_A), { id: UUIDV7_A, price: 100, dateBought: "2026-06-23" });
  });

  test("replaceOfficeTable rejects missing dateBought", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    assert.throws(
      () => service.replaceOfficeTable(UUIDV7_A, { price: 200 }),
      ValidationError
    );
  });

  test("replaceOfficeTable throws 404 when id does not exist", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(
      () => service.replaceOfficeTable(UUIDV7_A, { price: 200, dateBought: "2026-07-01" }),
      NotFoundError
    );
  });

  test("deleteOfficeTable removes stored table", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 100, dateBought: "2026-06-23" });

    service.deleteOfficeTable(UUIDV7_A);

    assert.strictEqual(store.get(UUIDV7_A), undefined);
  });

  test("deleteOfficeTable throws for malformed id", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(() => service.deleteOfficeTable("not-a-uuid"), ValidationError);
  });

  test("deleteOfficeTable throws 404 for missing id", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(() => service.deleteOfficeTable(UUIDV7_A), NotFoundError);
  });

  test("listOfficeTables paginates by id ascending", () => {
    const store = createOfficeTableStore();
    let counter = 0;
    const ids = [UUIDV7_A, UUIDV7_B];
    const service = createOfficeTableService({
      store,
      generateId: () => ids[counter++],
    });

    service.createOfficeTable({ price: 1, dateBought: "2026-06-23" });
    service.createOfficeTable({ price: 2, dateBought: "2026-06-24" });

    const page = service.listOfficeTables({ limit: 1 });

    assert.strictEqual(page.items.length, 1);
    assert.strictEqual(page.items[0].id, UUIDV7_A);
    assert.ok(page.nextCursor);
  });

  test("listOfficeTables uses default limit", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store, generateId: () => UUIDV7_A });
    service.createOfficeTable({ price: 1, dateBought: "2026-06-23" });

    const page = service.listOfficeTables();

    assert.strictEqual(page.items.length, 1);
    assert.strictEqual(page.nextCursor, undefined);
  });

  test("listOfficeTables rejects invalid limit", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    assert.throws(() => service.listOfficeTables({ limit: 0 }), ValidationError);
    assert.throws(() => service.listOfficeTables({ limit: 101 }), ValidationError);
    assert.throws(() => service.listOfficeTables({ limit: "abc" }), ValidationError);
  });
});

describe("default generateId", () => {
  test("generates a UUIDv7 id when none is injected", () => {
    const store = createOfficeTableStore();
    const service = createOfficeTableService({ store });

    const table = service.createOfficeTable({ price: 10, dateBought: "2026-06-23" });

    assert.ok(isUuidV7(table.id));
  });
});
