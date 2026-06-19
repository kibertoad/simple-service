"use strict";

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../src/app");

// ---------------------------------------------------------------------------
// Tiny supertest-free HTTP helper: starts the app on an ephemeral port and
// issues JSON requests. Returns { status, body }.
// ---------------------------------------------------------------------------
async function startServer() {
  return new Promise((resolve) => {
    const app = createApp();
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

function request(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method,
        path,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload || ""),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = raw.length ? JSON.parse(raw) : null;
          } catch {
            parsed = null;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let ctx;

beforeEach(async () => {
  ctx = await startServer();
});

afterEach((t, done) => {
  ctx.server.close(done);
});

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------
test("GET /health returns 200 ok", async () => {
  const res = await request(ctx.port, "GET", "/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("POST /echo returns 200 with the validated body for a valid payload", async () => {
  const res = await request(ctx.port, "POST", "/echo", { message: "hello" });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { received: { message: "hello" } });
});

test("POST /echo accepts optional meta map", async () => {
  const res = await request(ctx.port, "POST", "/echo", {
    message: "hi",
    meta: { lang: "en" },
  });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { received: { message: "hi", meta: { lang: "en" } } });
});

// ---------------------------------------------------------------------------
// Validation failures -> 400 with structured issues
// ---------------------------------------------------------------------------
test("POST /echo returns 400 VALIDATION_ERROR when message is missing", async () => {
  const res = await request(ctx.port, "POST", "/echo", {});
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.equal(res.body.error.status, 400);
  assert.ok(Array.isArray(res.body.error.issues));
  const messageIssue = res.body.error.issues.find((i) => i.path === "message");
  assert.ok(messageIssue, "expected an issue on the message field");
});

test("POST /echo returns 400 when message is an empty string", async () => {
  const res = await request(ctx.port, "POST", "/echo", { message: "" });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("POST /echo returns 400 (unrecognized_keys) for unexpected fields", async () => {
  const res = await request(ctx.port, "POST", "/echo", { message: "hi", rogue: 1 });
  assert.equal(res.status, 400);
  const codes = res.body.error.issues.map((i) => i.code);
  assert.ok(codes.includes("unrecognized_keys"));
});

test("POST /echo returns 400 for wrong message type", async () => {
  const res = await request(ctx.port, "POST", "/echo", { message: 123 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.equal(res.body.error.issues[0].code, "invalid_type");
});

test("POST /echo returns 400 when meta key count exceeds the cap", async () => {
  const meta = Object.fromEntries(
    Array.from({ length: 21 }, (_, i) => [`k${i}`, "v"])
  );
  const res = await request(ctx.port, "POST", "/echo", { message: "hi", meta });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

// ---------------------------------------------------------------------------
// Malformed JSON -> 400 (not 500)
// ---------------------------------------------------------------------------
test("POST /echo with malformed JSON body returns 400 VALIDATION_ERROR", async () => {
  const res = await new Promise((resolve, reject) => {
    const raw = "{ not json";
    const req = http.request(
      {
        host: "127.0.0.1",
        port: ctx.port,
        method: "POST",
        path: "/echo",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(raw),
        },
      },
      (r) => {
        let data = "";
        r.setEncoding("utf8");
        r.on("data", (c) => (data += c));
        r.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = null;
          }
          resolve({ status: r.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    req.write(raw);
    req.end();
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

// ---------------------------------------------------------------------------
// Unknown route -> 404 envelope
// ---------------------------------------------------------------------------
test("GET /nope returns 404 envelope", async () => {
  const res = await request(ctx.port, "GET", "/nope");
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, "NOT_FOUND");
});
