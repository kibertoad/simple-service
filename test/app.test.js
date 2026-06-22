const { test, describe } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const createApp = require("../src/app");

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
