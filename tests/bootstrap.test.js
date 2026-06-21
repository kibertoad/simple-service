"use strict";

const { buildResource, buildExporters, buildTracerProvider, bootstrapTelemetry } = require("../src/telemetry/bootstrap");

describe("buildResource", () => {
  it("includes required resource attributes", () => {
    const resource = buildResource({
      serviceName: "demo",
      serviceVersion: "1.0.0",
      deploymentEnvironment: "test",
      serviceNamespace: "acme",
      resourceAttributesString: "custom.key=value",
    });

    const attrs = resource.attributes;
    expect(attrs["service.name"]).toBe("demo");
    expect(attrs["service.version"]).toBe("1.0.0");
    expect(attrs["deployment.environment"]).toBe("test");
    expect(attrs["service.namespace"]).toBe("acme");
    expect(attrs["custom.key"]).toBe("value");
  });
});

describe("buildExporters", () => {
  it("returns undefined exporters when endpoint is empty", () => {
    const exporters = buildExporters({ endpoint: "" });
    expect(exporters.traceExporter).toBeUndefined();
    expect(exporters.metricExporter).toBeUndefined();
  });

  it("returns exporters when endpoint is configured", () => {
    const exporters = buildExporters({ endpoint: "http://collector:4318" });
    expect(exporters.traceExporter).toBeDefined();
    expect(exporters.metricExporter).toBeDefined();
  });
});

describe("buildTracerProvider", () => {
  it("creates a tracer provider and registers batch processor", () => {
    const resource = buildResource({
      serviceName: "demo",
      serviceVersion: "1.0.0",
      deploymentEnvironment: "test",
    });

    const fakeExporter = { export: jest.fn(), shutdown: jest.fn() };
    const provider = buildTracerProvider(
      {
        samplerArg: 0.1,
        batchMaxQueueSize: 64,
        batchMaxExportBatchSize: 8,
        batchScheduleDelayMillis: 1000,
      },
      resource,
      fakeExporter,
    );

    expect(provider).toBeDefined();
  });
});

describe("bootstrapTelemetry", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns disabled state when OTEL_ENABLED is not set", () => {
    delete process.env.OTEL_ENABLED;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const result = bootstrapTelemetry();

    expect(result.telemetryEnabled).toBe(false);
    expect(typeof result.shutdown).toBe("function");
  });
});
