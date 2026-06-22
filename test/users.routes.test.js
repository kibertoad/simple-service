"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const createApp = require("../src/app");

async function startServer() {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function baseUrl(server) {
  const address = server.address();
  return `http://${address.address}:${address.port}`;
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function patchJson(url, body) {
  return fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/users routes", () => {
  let server;
  let base;

  before(async () => {
    server = await startServer();
    base = baseUrl(server);
  });

  after(() => {
    server.close();
  });

  it("POST /users creates a user and returns 201", async () => {
    const res = await postJson(`${base}/users`, {
      email: "route@example.com",
      name: "Route",
      password: "password123",
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.email, "route@example.com");
    assert.equal(body.name, "Route");
    assert.equal(body.role, "user");
    assert.equal(body.password, undefined);
  });

  it("POST /users returns 422 on missing fields with details", async () => {
    const res = await postJson(`${base}/users`, { email: "x" });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.error);
    assert.ok(Array.isArray(body.details));
    assert.ok(body.details.length > 0);
  });

  it("POST /users returns 409 on duplicate email", async () => {
    await postJson(`${base}/users`, {
      email: "conflict@example.com",
      name: "One",
      password: "password123",
    });

    const res = await postJson(`${base}/users`, {
      email: "conflict@example.com",
      name: "Two",
      password: "password123",
    });
    assert.equal(res.status, 409);
  });

  it("GET /users/:id returns the user", async () => {
    const createRes = await postJson(`${base}/users`, {
      email: "read@example.com",
      name: "Reader",
      password: "password123",
    });
    const created = await createRes.json();

    const res = await fetch(`${base}/users/${created.id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, created.id);
  });

  it("GET /users/:id returns 404 for unknown id", async () => {
    const res = await fetch(`${base}/users/nonexistent-id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error);
  });

  it("GET /users lists users", async () => {
    const res = await fetch(`${base}/users`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.pagination);
  });

  it("PATCH /users/:id performs partial update", async () => {
    const createRes = await postJson(`${base}/users`, {
      email: "update@example.com",
      name: "Original",
      password: "password123",
    });
    const created = await createRes.json();

    const res = await patchJson(`${base}/users/${created.id}`, { name: "Updated" });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, "Updated");
    assert.equal(body.email, created.email);
  });

  it("PATCH /users/:id returns 404 for unknown id", async () => {
    const res = await patchJson(`${base}/users/nonexistent-id`, { name: "X" });
    assert.equal(res.status, 404);
  });

  it("PATCH /users/:id returns 422 for invalid data", async () => {
    const createRes = await postJson(`${base}/users`, {
      email: "invalid-update@example.com",
      name: "X",
      password: "password123",
    });
    const created = await createRes.json();

    const res = await patchJson(`${base}/users/${created.id}`, { email: "bad-email" });
    assert.equal(res.status, 422);
  });

  it("DELETE /users/:id removes the user", async () => {
    const createRes = await postJson(`${base}/users`, {
      email: "delete@example.com",
      name: "Delete Me",
      password: "password123",
    });
    const created = await createRes.json();

    const res = await fetch(`${base}/users/${created.id}`, { method: "DELETE" });
    assert.equal(res.status, 204);

    const getRes = await fetch(`${base}/users/${created.id}`);
    assert.equal(getRes.status, 404);
  });

  it("DELETE /users/:id returns 404 for unknown id", async () => {
    const res = await fetch(`${base}/users/nonexistent-id`, { method: "DELETE" });
    assert.equal(res.status, 404);
  });
});
