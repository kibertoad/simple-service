# simple-express-app

A minimal Express.js application demonstrating basic routing, JSON handling,
graceful shutdown, and OpenTelemetry instrumentation.

## Prerequisites

- Node.js >= 18

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Start with auto-reload on file changes (Node 18.11+):

```bash
npm run dev
```

By default the server listens on `http://0.0.0.0:3000`. Override with the
`PORT` and `HOST` environment variables:

```bash
PORT=8080 npm start
```

## Endpoints

| Method | Path      | Description                                  |
| ------ | --------- | -------------------------------------------- |
| GET    | `/`       | Returns a greeting JSON message.             |
| GET    | `/health` | Health check endpoint.                       |
| POST   | `/echo`   | Echoes back the JSON body you send.          |
| GET    | `/work`   | Demonstrates a manually instrumented span.   |

## OpenTelemetry

Telemetry is disabled by default. Enable it by setting environment variables
before starting the server:

```bash
OTEL_ENABLED=true \
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318 \
OTEL_SERVICE_NAME=simple-express-app \
OTEL_DEPLOYMENT_ENVIRONMENT=production \
OTEL_TRACES_SAMPLER_ARG=0.1 \
npm start
```

### Key environment variables

| Variable                      | Default                 | Description                                           |
| ----------------------------- | ----------------------- | ----------------------------------------------------- |
| `OTEL_ENABLED`                | `false`                 | Set to `true` to enable telemetry.                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | —                       | Base URL of the OTLP-compatible backend.              |
| `OTEL_SERVICE_NAME`           | `simple-express-app`    | `service.name` resource attribute.                    |
| `OTEL_SERVICE_VERSION`        | `1.1.0`                 | `service.version` resource attribute.                 |
| `OTEL_DEPLOYMENT_ENVIRONMENT` | `local`                 | `deployment.environment` resource attribute.          |
| `OTEL_TRACES_SAMPLER_ARG`     | `0.1`                   | Sampling ratio from `0.0` to `1.0`.                   |
| `OTEL_BSP_MAX_QUEUE_SIZE`     | `2048`                  | Max number of pending spans in the batch queue.       |
| `OTEL_BSP_MAX_EXPORT_BATCH_SIZE` | `512`                | Max spans exported per batch.                         |

### What is instrumented

- HTTP server requests (auto-instrumentation).
- Common Node.js libraries via `@opentelemetry/auto-instrumentations-node`.
- Manual spans via `telemetry/helpers.withSpan()`.
- Log correlation: every log line includes `trace_id` and `span_id` when inside an active span.
- PII redaction: span attributes matching a denylist (e.g. `authorization`, `password`, `token`, `email`) are replaced with `[REDACTED]` before export.

### Disabling telemetry

Unset `OTEL_ENABLED` or set it to `false`.  The application starts normally
and uses no-op providers.

## Project structure

```
.
├── package.json
├── README.md
├── jest.config.js
├── .eslintrc.js
└── src
    ├── app.js                    # Express app factory and routes
    ├── server.js                 # Server bootstrap and lifecycle
    └── telemetry
        ├── index.js              # Public telemetry API
        ├── config.js             # Environment-based configuration
        ├── bootstrap.js          # OTel SDK initialization
        ├── piiFilter.js          # PII redaction filter
        ├── helpers.js            # Manual span/metric helpers
        ├── middleware.js         # Express telemetry middleware
        └── logger.js             # Correlation-aware logger
```

## Testing

```bash
npm test
```

## License

MIT
