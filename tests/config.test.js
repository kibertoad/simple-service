"use strict";

const { loadTelemetryConfig } = require("../src/telemetry/config");

describe("loadTelemetryConfig", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("disables telemetry by default and returns safe defaults", () => {
    delete process.env.OTEL_ENABLED;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const config = loadTelemetryConfig();

    expect(config.enabled).toBe(false);
    expect(config.endpoint).toBe("");
    expect(config.protocol).toBe("http/protobuf");
    expect(config.sampler).toBe("parentbased_traceidratio");
    expect(config.samplerArg).toBe(0.1);
    expect(config.serviceName).toBe("simple-express-app");
  });

  it("enables telemetry when OTEL_ENABLED=true and endpoint is supplied", () => {
    process.env.OTEL_ENABLED = "true";
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://otel-collector:4318";
    process.env.OTEL_SERVICE_NAME = "test-service";
    process.env.OTEL_TRACES_SAMPLER_ARG = "0.5";

    const config = loadTelemetryConfig();

    expect(config.enabled).toBe(true);
    expect(config.endpoint).toBe("http://otel-collector:4318");
    expect(config.serviceName).toBe("test-service");
    expect(config.samplerArg).toBe(0.5);
  });

  it("clamps samplerArg to [0, 1]", () => {
    process.env.OTEL_TRACES_SAMPLER_ARG = "2.0";
    const config = loadTelemetryConfig();
    expect(config.samplerArg).toBe(1);
  });
});
