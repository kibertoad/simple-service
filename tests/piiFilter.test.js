"use strict";

const { PIIFilter, wrapExporter } = require("../src/telemetry/piiFilter");

describe("PIIFilter", () => {
  it("identifies sensitive attribute keys", () => {
    const filter = new PIIFilter();

    expect(filter.isSensitive("authorization")).toBe(true);
    expect(filter.isSensitive("http.request.header.authorization")).toBe(true);
    expect(filter.isSensitive("password")).toBe(true);
    expect(filter.isSensitive("email")).toBe(true);
    expect(filter.isSensitive("http.method")).toBe(false);
  });

  it("redacts attributes matching the denylist", () => {
    const filter = new PIIFilter();
    const span = {
      name: "test",
      attributes: {
        "http.method": "GET",
        password: "secret123",
        "http.request.header.authorization": "Bearer xyz",
      },
    };

    const redacted = filter.redactSpan(span);

    expect(redacted.attributes["http.method"]).toBe("GET");
    expect(redacted.attributes.password).toBe("[REDACTED]");
    expect(redacted.attributes["http.request.header.authorization"]).toBe("[REDACTED]");
  });
});

describe("wrapExporter", () => {
  it("passes spans through the exporter after redaction", (done) => {
    const exported = [];
    const fakeExporter = {
      export(spans, callback) {
        exported.push(...spans);
        callback({ code: 0 });
      },
      shutdown() {
        return Promise.resolve();
      },
    };

    const wrapped = wrapExporter(fakeExporter);
    const span = {
      name: "test",
      attributes: { token: "abc" },
    };

    wrapped.export([span], () => {
      expect(exported).toHaveLength(1);
      expect(exported[0].attributes.token).toBe("[REDACTED]");
      done();
    });
  });
});
