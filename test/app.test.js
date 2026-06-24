const { test, describe } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const createApp = require("../src/app");

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isUuidv7(value) {
  // A UUIDv7 has version nibble == 7 at the start of the third group: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
  if (!isUuid(value)) return false;
  const versionNibble = value.charAt(14);
  return versionNibble === "7";
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

describe("Bear CRUD endpoints", () => {
  test("POST /bears creates a bear with UUIDv7 id", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" })
      .expect(201);

    assert.ok(isUuidv7(res.body.id), "expected a UUIDv7 id");
    assert.strictEqual(res.body.name, "Paddington");
    assert.strictEqual(res.body.age, 5);
    assert.strictEqual(res.body.colour, "brown");
    assert.deepStrictEqual(Object.keys(res.body).sort(), ["age", "colour", "id", "name"]);
  });

  test("POST /bears rejects empty name", async () => {
    const app = createApp();
    await request(app)
      .post("/bears")
      .send({ name: "", age: 5, colour: "brown" })
      .expect(400, { error: "name is required", code: "VALIDATION_ERROR" });
  });

  test("POST /bears rejects name exceeding 100 characters", async () => {
    const app = createApp();
    await request(app)
      .post("/bears")
      .send({ name: "A".repeat(101), age: 5, colour: "brown" })
      .expect(400, { error: "name must be no more than 100 characters", code: "VALIDATION_ERROR" });
  });

  test("POST /bears rejects duplicate name", async () => {
    const app = createApp();
    await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" })
      .expect(201);

    await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 3, colour: "black" })
      .expect(409, { error: "Name already in use", code: "CONFLICT" });
  });

  test("POST /bears rejects name with invalid characters", async () => {
    const app = createApp();
    await request(app)
      .post("/bears")
      .send({ name: "Paddington@Home", age: 5, colour: "brown" })
      .expect(400, { error: "name contains invalid characters", code: "VALIDATION_ERROR" });
  });

  test("POST /bears rejects negative age", async () => {
    const app = createApp();
    await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: -1, colour: "brown" })
      .expect(400, { error: "age must be non-negative", code: "VALIDATION_ERROR" });
  });

  test("POST /bears rejects fractional age", async () => {
    const app = createApp();
    await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5.5, colour: "brown" })
      .expect(400, { error: "age must be an integer", code: "VALIDATION_ERROR" });
  });

  test("GET /bears/:id returns the bear", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    const id = createRes.body.id;
    const res = await request(app).get(`/bears/${id}`).expect(200);

    assert.deepStrictEqual(res.body, { id, name: "Paddington", age: 5, colour: "brown" });
  });

  test("GET /bears/:id returns 404 for unknown id", async () => {
    const app = createApp();
    await request(app)
      .get("/bears/00000000-0000-0000-0000-000000000000")
      .expect(404, { error: "Bear not found", code: "NOT_FOUND" });
  });

  test("GET /bears lists bears with cursor pagination", async () => {
    const app = createApp();
    await request(app).post("/bears").send({ name: "Alpha", age: 1, colour: "" });
    await request(app).post("/bears").send({ name: "Beta", age: 2, colour: "" });
    await request(app).post("/bears").send({ name: "Gamma", age: 3, colour: "" });

    const page1 = await request(app).get("/bears?limit=2").expect(200);

    assert.strictEqual(page1.body.data.length, 2);
    assert.strictEqual(typeof page1.body.nextCursor, "string");

    const page2 = await request(app)
      .get("/bears")
      .query({ cursor: page1.body.nextCursor, limit: 2 })
      .expect(200);

    assert.strictEqual(page2.body.data.length, 1);
    assert.strictEqual(page2.body.nextCursor, null);
  });

  test("GET /bears returns empty paginated result set", async () => {
    const app = createApp();
    const res = await request(app).get("/bears").expect(200);

    assert.deepStrictEqual(res.body, { data: [], nextCursor: null });
  });

  test("GET /bears defaults limit to 50", async () => {
    const app = createApp();
    for (let i = 0; i < 55; i++) {
      await request(app)
        .post("/bears")
        .send({ name: `Bear${i.toString().padStart(2, "0")}`, age: 1, colour: "" });
    }

    const res = await request(app).get("/bears").expect(200);
    assert.strictEqual(res.body.data.length, 50);
    assert.strictEqual(typeof res.body.nextCursor, "string");
  });

  test("GET /bears rejects malformed cursor", async () => {
    const app = createApp();
    await request(app)
      .get("/bears?cursor=not-valid-base64")
      .expect(400, { error: "Invalid cursor", code: "VALIDATION_ERROR" });
  });

  test("GET /bears rejects non-integer limit", async () => {
    const app = createApp();
    await request(app)
      .get("/bears?limit=foo")
      .expect(400, { error: "limit must be a positive integer", code: "VALIDATION_ERROR" });
  });

  test("GET /bears rejects negative limit", async () => {
    const app = createApp();
    await request(app)
      .get("/bears?limit=-5")
      .expect(400, { error: "limit must be a positive integer", code: "VALIDATION_ERROR" });
  });

  test("GET /bears caps limit at 100", async () => {
    const app = createApp();
    for (let i = 0; i < 105; i++) {
      await request(app)
        .post("/bears")
        .send({ name: `Bear${i.toString().padStart(3, "0")}`, age: 1, colour: "" });
    }

    const res = await request(app).get("/bears?limit=200").expect(200);
    assert.strictEqual(res.body.data.length, 100);
  });

  test("PUT /bears/:id fully replaces mutable fields", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    const id = createRes.body.id;
    const res = await request(app)
      .put(`/bears/${id}`)
      .send({ name: "Pooh", age: 10, colour: "yellow" })
      .expect(200);

    assert.deepStrictEqual(res.body, { id, name: "Pooh", age: 10, colour: "yellow" });
  });

  test("PUT /bears/:id rejects invalid age", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    await request(app)
      .put(`/bears/${createRes.body.id}`)
      .send({ name: "Paddington", age: -1, colour: "brown" })
      .expect(400, { error: "age must be non-negative", code: "VALIDATION_ERROR" });
  });

  test("PUT /bears/:id rejects duplicate name held by another bear", async () => {
    const app = createApp();
    await request(app).post("/bears").send({ name: "Paddington", age: 5, colour: "brown" });
    const other = await request(app).post("/bears").send({ name: "Pooh", age: 10, colour: "yellow" });

    await request(app)
      .put(`/bears/${other.body.id}`)
      .send({ name: "Paddington", age: 10, colour: "yellow" })
      .expect(409, { error: "Name already in use", code: "CONFLICT" });
  });

  test("PUT /bears/:id rejects empty name", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    await request(app)
      .put(`/bears/${createRes.body.id}`)
      .send({ name: "", age: 5, colour: "brown" })
      .expect(400, { error: "name is required", code: "VALIDATION_ERROR" });
  });

  test("PUT /bears/:id allows keeping own name and omits colour", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    const id = createRes.body.id;
    const res = await request(app)
      .put(`/bears/${id}`)
      .send({ name: "Paddington", age: 6 })
      .expect(200);

    assert.deepStrictEqual(res.body, { id, name: "Paddington", age: 6, colour: "" });
  });

  test("DELETE /bears/:id removes the bear", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    await request(app).delete(`/bears/${createRes.body.id}`).expect(204);
    await request(app)
      .get(`/bears/${createRes.body.id}`)
      .expect(404, { error: "Bear not found", code: "NOT_FOUND" });
  });

  test("DELETE /bears/:id returns 404 for unknown id", async () => {
    const app = createApp();
    await request(app)
      .delete("/bears/00000000-0000-0000-0000-000000000000")
      .expect(404, { error: "Bear not found", code: "NOT_FOUND" });
  });

  test("POST /bears discards extra fields and ignores client-supplied id", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/bears")
      .send({ id: "client-id", name: "Paddington", age: 5, colour: "brown", extra: "drop" })
      .expect(201);

    assert.notStrictEqual(res.body.id, "client-id");
    assert.ok(isUuidv7(res.body.id));
    assert.deepStrictEqual(Object.keys(res.body).sort(), ["age", "colour", "id", "name"]);
  });

  test("PUT /bears/:id ignores conflicting body id and keeps path id", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    const id = createRes.body.id;
    const otherId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .put(`/bears/${id}`)
      .send({ id: otherId, name: "Pooh", age: 10, colour: "yellow" })
      .expect(200);

    assert.strictEqual(res.body.id, id);
    assert.notStrictEqual(res.body.id, otherId);
  });

  test("PUT /bears/:id discards extra fields", async () => {
    const app = createApp();
    const createRes = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" });

    const id = createRes.body.id;
    const res = await request(app)
      .put(`/bears/${id}`)
      .send({ name: "Pooh", age: 10, colour: "yellow", extra: "drop" })
      .expect(200);

    assert.deepStrictEqual(Object.keys(res.body).sort(), ["age", "colour", "id", "name"]);
  });

  test("POST /bears accepts boundary values", async () => {
    const app = createApp();
    const longColour = "x".repeat(10000);
    const res = await request(app)
      .post("/bears")
      .send({ name: "A".repeat(100), age: 0, colour: longColour })
      .expect(201);

    assert.strictEqual(res.body.name, "A".repeat(100));
    assert.strictEqual(res.body.age, 0);
    assert.strictEqual(res.body.colour, longColour);
  });

  test("two POST /bears requests assign distinct ids", async () => {
    const app = createApp();
    const res1 = await request(app)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" })
      .expect(201);
    const res2 = await request(app)
      .post("/bears")
      .send({ name: "Pooh", age: 10, colour: "yellow" })
      .expect(201);

    assert.notStrictEqual(res1.body.id, res2.body.id);
  });

  test("bear records do not persist across fresh app instances", async () => {
    const app1 = createApp();
    const createRes = await request(app1)
      .post("/bears")
      .send({ name: "Paddington", age: 5, colour: "brown" })
      .expect(201);

    const app2 = createApp();
    await request(app2)
      .get(`/bears/${createRes.body.id}`)
      .expect(404, { error: "Bear not found", code: "NOT_FOUND" });
  });
});
