const { test, describe } = require("node:test");
const assert = require("node:assert");
const { createOrganizationService } = require("./organizationService");
const { createOrganizationStore } = require("../store/organizationStore");
const { ValidationError, NotFoundError, ConflictError } = require("../domain/errors");

describe("createOrganizationService", () => {
  test("persists an organization with generated id", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });

    const org = service.createOrganization({ name: "Acme", slug: "acme" });

    assert.deepStrictEqual(org, { id: "id-1", name: "Acme", slug: "acme" });
    assert.deepStrictEqual(store.get("id-1"), org);
  });

  test("rejects duplicate slug on create", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });
    service.createOrganization({ name: "Acme", slug: "acme" });

    assert.throws(
      () => service.createOrganization({ name: "Other", slug: "acme" }),
      ConflictError
    );
  });

  test("replaceOrganization fully replaces an existing organization", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });
    service.createOrganization({ name: "Acme", slug: "acme" });

    const org = service.replaceOrganization("id-1", { id: "id-1", name: "Acme Inc", slug: "acme-inc" });

    assert.deepStrictEqual(org, { id: "id-1", name: "Acme Inc", slug: "acme-inc" });
    assert.deepStrictEqual(store.get("id-1"), org);
  });

  test("replaceOrganization updates slug index", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });
    service.createOrganization({ name: "Acme", slug: "acme" });

    service.replaceOrganization("id-1", { id: "id-1", name: "Acme", slug: "acme-inc" });

    assert.strictEqual(store.getBySlug("acme"), undefined);
    assert.deepStrictEqual(store.getBySlug("acme-inc"), { id: "id-1", name: "Acme", slug: "acme-inc" });
  });

  test("replaceOrganization rejects missing id", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });

    assert.throws(
      () => service.replaceOrganization("id-1", { name: "Acme", slug: "acme" }),
      ValidationError
    );
  });

  test("replaceOrganization rejects id mismatch", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });

    assert.throws(
      () => service.replaceOrganization("id-1", { id: "id-2", name: "Acme", slug: "acme" }),
      ValidationError
    );
  });

  test("replaceOrganization rejects non-existent organization", () => {
    const store = createOrganizationStore();
    const service = createOrganizationService({ store, generateId: () => "id-1" });

    assert.throws(
      () => service.replaceOrganization("id-1", { id: "id-1", name: "Acme", slug: "acme" }),
      NotFoundError
    );
  });

  test("replaceOrganization rejects slug held by another organization", () => {
    const store = createOrganizationStore();
    let counter = 0;
    const service = createOrganizationService({ store, generateId: () => `id-${++counter}` });
    service.createOrganization({ name: "Acme", slug: "acme" });
    service.createOrganization({ name: "Other", slug: "other" });

    assert.throws(
      () => service.replaceOrganization("id-2", { id: "id-2", name: "Other", slug: "acme" }),
      ConflictError
    );
  });

  test("replaceOrganization allows keeping own slug", () => {
    const store = createOrganizationStore();
    let counter = 0;
    const service = createOrganizationService({ store, generateId: () => `id-${++counter}` });
    service.createOrganization({ name: "Acme", slug: "acme" });
    service.createOrganization({ name: "Other", slug: "other" });

    const org = service.replaceOrganization("id-1", { id: "id-1", name: "Acme Inc", slug: "acme" });

    assert.deepStrictEqual(org, { id: "id-1", name: "Acme Inc", slug: "acme" });
  });
});
