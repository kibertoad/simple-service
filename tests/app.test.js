"use strict";

const request = require("supertest");
const createApp = require("../src/app");

describe("Express app", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it("GET / returns a greeting", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Hello, Express!");
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /echo echoes the body", async () => {
    const payload = { hello: "world" };
    const res = await request(app).post("/echo").send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toEqual(payload);
  });

  it("GET /work returns done and is traced", async () => {
    const res = await request(app).get("/work");
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  it("unknown routes return 404", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});
