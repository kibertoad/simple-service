"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { UserService } = require("../src/users/UserService");
const { ValidationError, NotFoundError, ConflictError } = require("../src/users/errors");

describe("UserService", () => {
  function makeService() {
    return new UserService();
  }

  function validInput(overrides) {
    return {
      email: "alice@example.com",
      name: "Alice",
      password: "secret123",
      ...overrides,
    };
  }

  describe("createUser", () => {
    it("creates a user with generated id and timestamps", async () => {
      const service = makeService();
      const user = await service.createUser(validInput());

      assert.equal(typeof user.id, "string");
      assert.ok(user.id.length > 0);
      assert.equal(user.email, "alice@example.com");
      assert.equal(user.name, "Alice");
      assert.equal(user.role, "user");
      assert.ok(user.createdAt);
      assert.ok(user.updatedAt);
      assert.equal(user.createdAt, user.updatedAt);
      assert.equal(user.password, undefined);
    });

    it("allows explicit admin role", async () => {
      const service = makeService();
      const user = await service.createUser(validInput({ role: "admin" }));
      assert.equal(user.role, "admin");
    });

    it("rejects missing required fields", async () => {
      const service = makeService();
      await assert.rejects(
        service.createUser({ email: "x" }),
        (err) => err instanceof ValidationError && err.details.some((d) => d.field === "name") && err.details.some((d) => d.field === "password")
      );
    });

    it("rejects invalid email", async () => {
      const service = makeService();
      await assert.rejects(
        service.createUser(validInput({ email: "not-an-email" })),
        (err) => err instanceof ValidationError && err.details.some((d) => d.field === "email")
      );
    });

    it("rejects short password", async () => {
      const service = makeService();
      await assert.rejects(
        service.createUser(validInput({ password: "short" })),
        (err) => err instanceof ValidationError && err.details.some((d) => d.field === "password")
      );
    });

    it("rejects empty name", async () => {
      const service = makeService();
      await assert.rejects(
        service.createUser(validInput({ name: "   " })),
        (err) => err instanceof ValidationError && err.details.some((d) => d.field === "name")
      );
    });

    it("normalizes email to lowercase", async () => {
      const service = makeService();
      const user = await service.createUser(validInput({ email: "Alice@Example.COM" }));
      assert.equal(user.email, "alice@example.com");
    });

    it("prevents duplicate email case-insensitively", async () => {
      const service = makeService();
      await service.createUser(validInput({ email: "Alice@Example.com" }));
      await assert.rejects(
        service.createUser(validInput({ email: "alice@example.com" })),
        (err) => err instanceof ConflictError
      );
    });

    it("hashes password and never exposes it", async () => {
      const service = makeService();
      await service.createUser(validInput({ email: "bob@example.com" }));
      const stored = service.store.values().next().value;
      assert.ok(stored.password);
      assert.ok(!stored.password.includes("secret123"));
    });
  });

  describe("getUser", () => {
    it("returns the stored user", async () => {
      const service = makeService();
      const created = await service.createUser(validInput());
      const user = service.getUser(created.id);
      assert.deepEqual(user, created);
    });

    it("throws NotFoundError for unknown id", () => {
      const service = makeService();
      assert.throws(() => service.getUser("no-such-id"), NotFoundError);
    });
  });

  describe("listUsers", () => {
    it("returns paginated results with defaults", async () => {
      const service = makeService();
      for (let i = 0; i < 5; i += 1) {
        await service.createUser(validInput({ email: `u${i}@example.com` }));
      }

      const result = service.listUsers();
      assert.equal(result.data.length, 5);
      assert.equal(result.pagination.total, 5);
      assert.equal(result.pagination.limit, 20);
      assert.equal(result.pagination.offset, 0);
    });

    it("filters by role", async () => {
      const service = makeService();
      await service.createUser(validInput({ email: "a@example.com", role: "admin" }));
      await service.createUser(validInput({ email: "u@example.com" }));

      const result = service.listUsers({ role: "admin" });
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].role, "admin");
    });

    it("filters by email substring", async () => {
      const service = makeService();
      await service.createUser(validInput({ email: "alpha@example.com" }));
      await service.createUser(validInput({ email: "beta@example.com" }));

      const result = service.listUsers({ q: "alpha" });
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].email, "alpha@example.com");
    });

    it("supports pagination", async () => {
      const service = makeService();
      for (let i = 0; i < 5; i += 1) {
        // Create in sequence with a small delay to keep createdAt order stable.
        await service.createUser(validInput({ email: `u${i}@example.com` }));
      }

      const page1 = service.listUsers({ limit: "2", offset: "0" });
      assert.equal(page1.data.length, 2);

      const page2 = service.listUsers({ limit: "2", offset: "2" });
      assert.equal(page2.data.length, 2);
    });

    it("clamps limit to a maximum", async () => {
      const service = makeService();
      for (let i = 0; i < 3; i += 1) {
        await service.createUser(validInput({ email: `u${i}@example.com` }));
      }
      const result = service.listUsers({ limit: "999" });
      assert.equal(result.pagination.limit, 100);
    });
  });

  describe("updateUser", () => {
    it("performs a partial update and refreshes updatedAt", async () => {
      const service = makeService();
      const created = await service.createUser(validInput());
      const updated = await service.updateUser(created.id, { name: "Alicia" });

      assert.equal(updated.name, "Alicia");
      assert.equal(updated.email, created.email);
      assert.equal(updated.role, created.role);
      assert.equal(updated.createdAt, created.createdAt);
      assert.notEqual(updated.updatedAt, created.updatedAt);
    });

    it("updates email with uniqueness check", async () => {
      const service = makeService();
      const first = await service.createUser(validInput({ email: "alice@example.com" }));
      await service.createUser(validInput({ email: "bob@example.com" }));

      await assert.rejects(
        service.updateUser(first.id, { email: "bob@example.com" }),
        ConflictError
      );
    });

    it("throws NotFoundError for unknown id", async () => {
      const service = makeService();
      await assert.rejects(service.updateUser("missing", { name: "X" }), NotFoundError);
    });

    it("rejects empty update body", async () => {
      const service = makeService();
      const created = await service.createUser(validInput());
      await assert.rejects(service.updateUser(created.id, {}), ValidationError);
    });

    it("hashes updated password", async () => {
      const service = makeService();
      const created = await service.createUser(validInput());
      await service.updateUser(created.id, { password: "newpass123" });
      const stored = service.store.get(created.id);
      assert.ok(stored.password);
      assert.ok(!stored.password.includes("newpass123"));
    });
  });

  describe("deleteUser", () => {
    it("removes the user", async () => {
      const service = makeService();
      const created = await service.createUser(validInput());
      service.deleteUser(created.id);
      assert.throws(() => service.getUser(created.id), NotFoundError);
    });

    it("throws NotFoundError for unknown id", () => {
      const service = makeService();
      assert.throws(() => service.deleteUser("missing"), NotFoundError);
    });
  });
});
