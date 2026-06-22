const { test, describe } = require("node:test");
const assert = require("node:assert");
const { createUserService } = require("./userService");
const { createUserStore } = require("../store/userStore");
const { ValidationError, NotFoundError, ConflictError } = require("../domain/errors");

describe("createUserService", () => {
  test("persists a user with generated id", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });

    const user = service.createUser({ name: "Alice", email: "alice@example.com" });

    assert.deepStrictEqual(user, { id: "id-1", name: "Alice", email: "alice@example.com" });
    assert.deepStrictEqual(store.get("id-1"), user);
  });

  test("rejects duplicate email on create", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });
    service.createUser({ name: "Alice", email: "alice@example.com" });

    assert.throws(
      () => service.createUser({ name: "Bob", email: "alice@example.com" }),
      ConflictError
    );
  });

  test("replaceUser fully replaces an existing user", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });
    service.createUser({ name: "Alice", email: "alice@example.com" });

    const user = service.replaceUser("id-1", { id: "id-1", name: "Alice Smith", email: "alice2@example.com" });

    assert.deepStrictEqual(user, { id: "id-1", name: "Alice Smith", email: "alice2@example.com" });
    assert.deepStrictEqual(store.get("id-1"), user);
  });

  test("replaceUser updates email index", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });
    service.createUser({ name: "Alice", email: "alice@example.com" });

    service.replaceUser("id-1", { id: "id-1", name: "Alice", email: "alice2@example.com" });

    assert.strictEqual(store.getByEmail("alice@example.com"), undefined);
    assert.deepStrictEqual(store.getByEmail("alice2@example.com"), { id: "id-1", name: "Alice", email: "alice2@example.com" });
  });

  test("replaceUser rejects missing id", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });

    assert.throws(
      () => service.replaceUser("id-1", { name: "Alice", email: "alice@example.com" }),
      ValidationError
    );
  });

  test("replaceUser rejects id mismatch", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });

    assert.throws(
      () => service.replaceUser("id-1", { id: "id-2", name: "Alice", email: "alice@example.com" }),
      ValidationError
    );
  });

  test("replaceUser rejects non-existent user", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id-1" });

    assert.throws(
      () => service.replaceUser("id-1", { id: "id-1", name: "Alice", email: "alice@example.com" }),
      NotFoundError
    );
  });

  test("replaceUser rejects email held by another user", () => {
    const store = createUserStore();
    const service = createUserService({ store, generateId: () => "id" });
    service.createUser({ name: "Alice", email: "alice@example.com" });

    assert.throws(
      () => service.replaceUser("id-1", { id: "id-1", name: "Alice", email: "alice@example.com" }),
      NotFoundError
    );
  });

  test("replaceUser allows keeping own email", () => {
    const store = createUserStore();
    let counter = 0;
    const service = createUserService({ store, generateId: () => `id-${++counter}` });
    service.createUser({ name: "Alice", email: "alice@example.com" });
    service.createUser({ name: "Bob", email: "bob@example.com" });

    const user = service.replaceUser("id-1", { id: "id-1", name: "Alice Smith", email: "alice@example.com" });

    assert.deepStrictEqual(user, { id: "id-1", name: "Alice Smith", email: "alice@example.com" });
  });
});
