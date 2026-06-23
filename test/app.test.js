const { test, describe } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const createApp = require("../src/app");

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isUuidV7(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

describe("User Management endpoints", () => {
  test("POST /users creates a user with system-generated UUID", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" })
      .expect(201);

    assert.ok(isUuid(res.body.id));
    assert.strictEqual(res.body.name, "Alice");
    assert.strictEqual(res.body.email, "alice@example.com");
    assert.deepStrictEqual(Object.keys(res.body).sort(), ["email", "id", "name"]);
  });

  test("POST /users rejects missing name", async () => {
    const app = createApp();
    await request(app)
      .post("/users")
      .send({ email: "alice@example.com" })
      .expect(400, { error: "name is required", code: "VALIDATION_ERROR" });
  });

  test("POST /users rejects missing email", async () => {
    const app = createApp();
    await request(app)
      .post("/users")
      .send({ name: "Alice" })
      .expect(400, { error: "email is required", code: "VALIDATION_ERROR" });
  });

  test("POST /users rejects duplicate email", async () => {
    const app = createApp();
    await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" })
      .expect(201);

    await request(app)
      .post("/users")
      .send({ name: "Alice2", email: "alice@example.com" })
      .expect(409, { error: "Email already in use", code: "CONFLICT" });
  });

  test("POST /users discards extra fields", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com", age: 30 })
      .expect(201);

    assert.deepStrictEqual(Object.keys(res.body).sort(), ["email", "id", "name"]);
  });

  test("POST /users ignores client-supplied id", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users")
      .send({ id: "not-a-uuid", name: "Alice", email: "alice@example.com" })
      .expect(201);

    assert.notStrictEqual(res.body.id, "not-a-uuid");
    assert.ok(isUuid(res.body.id));
  });

  test("two POST /users requests assign distinct ids", async () => {
    const app = createApp();
    const res1 = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" })
      .expect(201);
    const res2 = await request(app)
      .post("/users")
      .send({ name: "Bob", email: "bob@example.com" })
      .expect(201);

    assert.notStrictEqual(res1.body.id, res2.body.id);
  });
});

describe("Replace User endpoint", () => {
  test("PUT /users/:id replaces an existing user", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/users/${id}`)
      .send({ id, name: "Alice Smith", email: "alice.smith@example.com" })
      .expect(200);

    assert.strictEqual(res.body.id, id);
    assert.strictEqual(res.body.name, "Alice Smith");
    assert.strictEqual(res.body.email, "alice.smith@example.com");
    assert.deepStrictEqual(Object.keys(res.body).sort(), ["email", "id", "name"]);
  });

  test("PUT /users/:id returns 404 when target does not exist", async () => {
    const app = createApp();
    await request(app)
      .put("/users/00000000-0000-0000-0000-000000000000")
      .send({
        id: "00000000-0000-0000-0000-000000000000",
        name: "Ghost",
        email: "ghost@example.com",
      })
      .expect(404, { error: "User not found", code: "NOT_FOUND" });
  });

  test("PUT /users/:id rejects missing fields", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });

    await request(app)
      .put(`/users/${createRes.body.id}`)
      .send({ id: createRes.body.id, name: "Alice" })
      .expect(400, { error: "email is required", code: "VALIDATION_ERROR" });
  });

  test("PUT /users/:id rejects id mismatch", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });

    await request(app)
      .put(`/users/${createRes.body.id}`)
      .send({ id: "00000000-0000-0000-0000-000000000000", name: "Alice", email: "alice@example.com" })
      .expect(400, { error: "id in body does not match path id", code: "VALIDATION_ERROR" });
  });

  test("PUT /users/:id succeeds when repeating the user's own email", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });

    const id = createRes.body.id;

    await request(app)
      .put(`/users/${id}`)
      .send({ id, name: "Alice Smith", email: "alice@example.com" })
      .expect(200);
  });

  test("PUT /users/:id rejects email held by a different user", async () => {
    const app = createApp();
    const alice = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });
    const bob = await request(app)
      .post("/users")
      .send({ name: "Bob", email: "bob@example.com" });

    await request(app)
      .put(`/users/${bob.body.id}`)
      .send({ id: bob.body.id, name: "Bob", email: "alice@example.com" })
      .expect(409, { error: "Email already in use", code: "CONFLICT" });

    await request(app)
      .put(`/users/${bob.body.id}`)
      .send({ id: bob.body.id, name: "Bob", email: "bob2@example.com" })
      .expect(200);
  });

  test("PUT /users/:id discards extra fields", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });

    const res = await request(app)
      .put(`/users/${createRes.body.id}`)
      .send({ id: createRes.body.id, name: "Alice", email: "alice@example.com", age: 30 })
      .expect(200);

    assert.deepStrictEqual(Object.keys(res.body).sort(), ["email", "id", "name"]);
  });

  test("PUT /users/:id keeps id immutable", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" });

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/users/${id}`)
      .send({ id, name: "Alice Smith", email: "alice.smith@example.com" });

    assert.strictEqual(res.body.id, id);
  });
});

describe("Existing routes", () => {
  test("GET / returns greeting", async () => {
    const app = createApp();
    await request(app).get("/").expect(200, { message: "Hello, Express!" });
  });

  test("GET /health returns ok", async () => {
    const app = createApp();
    await request(app).get("/health").expect(200, { status: "ok" });
  });

  test("POST /echo echoes body", async () => {
    const app = createApp();
    await request(app)
      .post("/echo")
      .send({ hello: "world" })
      .expect(200, { received: { hello: "world" } });
  });
});

describe("Malformed JSON", () => {
  test("returns 400 for malformed JSON", async () => {
    const app = createApp();
    await request(app)
      .post("/users")
      .send("{ not json }")
      .set("Content-Type", "application/json")
      .expect(400);
  });
});

describe("Office Table Management endpoints", () => {
  test("POST /office-tables creates an office table with UUIDv7", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/office-tables")
      .send({ price: 250, dateBought: "2026-06-23" })
      .expect(201);

    assert.ok(isUuidV7(res.body.id));
    assert.strictEqual(res.body.price, 250);
    assert.strictEqual(res.body.dateBought, "2026-06-23");
    assert.deepStrictEqual(Object.keys(res.body).sort(), ["dateBought", "id", "price"]);
  });

  test("POST /office-tables ignores client-supplied id", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/office-tables")
      .send({ id: "not-a-uuid", price: 100, dateBought: "2026-06-23" })
      .expect(201);

    assert.notStrictEqual(res.body.id, "not-a-uuid");
    assert.ok(isUuidV7(res.body.id));
  });

  test("two POST /office-tables requests assign distinct ids", async () => {
    const app = createApp();
    const res1 = await request(app)
      .post("/office-tables")
      .send({ price: 1, dateBought: "2026-06-23" })
      .expect(201);
    const res2 = await request(app)
      .post("/office-tables")
      .send({ price: 2, dateBought: "2026-06-24" })
      .expect(201);

    assert.notStrictEqual(res1.body.id, res2.body.id);
  });

  test("POST /office-tables rejects negative price", async () => {
    const app = createApp();
    await request(app)
      .post("/office-tables")
      .send({ price: -1, dateBought: "2026-06-23" })
      .expect(400);

    const listRes = await request(app).get("/office-tables").expect(200);
    assert.deepStrictEqual(listRes.body, []);
  });

  test("POST /office-tables allows zero price", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/office-tables")
      .send({ price: 0, dateBought: "2026-06-23" })
      .expect(201);

    assert.strictEqual(res.body.price, 0);
  });

  test("GET /office-tables/:id returns an existing table", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/office-tables")
      .send({ price: 300, dateBought: "2026-06-23" })
      .expect(201);

    const id = createRes.body.id;

    const res = await request(app).get(`/office-tables/${id}`).expect(200);

    assert.deepStrictEqual(res.body, createRes.body);
  });

  test("GET /office-tables/:id returns 404 for non-existent id", async () => {
    const app = createApp();
    await request(app)
      .get("/office-tables/0193e272-5b18-7ff9-a1a2-123456789def")
      .expect(404);
  });

  test("GET /office-tables/:id returns 400 for malformed id", async () => {
    const app = createApp();
    await request(app).get("/office-tables/not-a-uuid").expect(400);
  });

  test("GET /office-tables returns direct JSON array with cursor header", async () => {
    const app = createApp();
    const a = await request(app)
      .post("/office-tables")
      .send({ price: 1, dateBought: "2026-06-23" })
      .expect(201);
    const b = await request(app)
      .post("/office-tables")
      .send({ price: 2, dateBought: "2026-06-24" })
      .expect(201);

    const first = await request(app).get("/office-tables?limit=1").expect(200);

    assert.ok(Array.isArray(first.body));
    assert.strictEqual(first.body.length, 1);
    assert.notStrictEqual(first.headers["x-next-cursor"], undefined);

    const second = await request(app)
      .get("/office-tables")
      .query({ cursor: first.headers["x-next-cursor"], limit: 1 })
      .expect(200);

    assert.strictEqual(second.body.length, 1);
    assert.strictEqual(second.headers["x-next-cursor"], undefined);
    assert.notStrictEqual(first.body[0].id, second.body[0].id);
    assert.deepStrictEqual(new Set([first.body[0].id, second.body[0].id]), new Set([a.body.id, b.body.id]));
  });

  test("PUT /office-tables/:id fully replaces a table", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/office-tables")
      .send({ price: 100, dateBought: "2026-06-23" })
      .expect(201);

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/office-tables/${id}`)
      .send({ price: 150, dateBought: "2026-07-01" })
      .expect(200);

    assert.strictEqual(res.body.id, id);
    assert.strictEqual(res.body.price, 150);
    assert.strictEqual(res.body.dateBought, "2026-07-01");
    assert.deepStrictEqual(Object.keys(res.body).sort(), ["dateBought", "id", "price"]);
  });

  test("PUT /office-tables/:id ignores body id and keeps path id", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/office-tables")
      .send({ price: 100, dateBought: "2026-06-23" })
      .expect(201);

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/office-tables/${id}`)
      .send({ id: "0193e272-5b18-7ff9-a1a2-123456789def", price: 150, dateBought: "2026-07-01" })
      .expect(200);

    assert.strictEqual(res.body.id, id);
  });

  test("PUT /office-tables/:id rejects negative price", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/office-tables")
      .send({ price: 100, dateBought: "2026-06-23" })
      .expect(201);

    await request(app)
      .put(`/office-tables/${createRes.body.id}`)
      .send({ price: -5, dateBought: "2026-07-01" })
      .expect(400);

    const getRes = await request(app).get(`/office-tables/${createRes.body.id}`).expect(200);
    assert.strictEqual(getRes.body.price, 100);
  });

  test("PUT /office-tables/:id returns 404 when target does not exist", async () => {
    const app = createApp();
    await request(app)
      .put("/office-tables/0193e272-5b18-7ff9-a1a2-123456789def")
      .send({ price: 100, dateBought: "2026-06-23" })
      .expect(404);
  });

  test("DELETE /office-tables/:id removes a table", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/office-tables")
      .send({ price: 100, dateBought: "2026-06-23" })
      .expect(201);

    await request(app).delete(`/office-tables/${createRes.body.id}`).expect(204);
    await request(app).get(`/office-tables/${createRes.body.id}`).expect(404);
  });

  test("DELETE /office-tables/:id returns 404 for non-existent id", async () => {
    const app = createApp();
    await request(app)
      .delete("/office-tables/0193e272-5b18-7ff9-a1a2-123456789def")
      .expect(404);
  });

  test("DELETE /office-tables/:id returns 400 for malformed id", async () => {
    const app = createApp();
    await request(app).delete("/office-tables/not-a-uuid").expect(400);
  });

  test("Office Table endpoint URLs have no version prefix", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/office-tables")
      .send({ price: 100, dateBought: "2026-06-23" })
      .expect(201);

    assert.strictEqual(res.req.path.startsWith("/v1"), false);
    assert.strictEqual(res.req.path, "/office-tables");
  });
});
