# simple-express-app

A minimal Express.js application demonstrating basic routing, JSON handling,
and graceful shutdown.

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

| Method | Path      | Description                                       |
| ------ | --------- | ------------------------------------------------- |
| GET    | `/`       | Returns a greeting JSON message.                  |
| GET    | `/health` | Health check endpoint.                            |
| POST   | `/echo`   | Echoes back a validated JSON body (`{ message }`).|

### `POST /echo`

Request bodies are validated with [zod](https://zod.dev) at the request
boundary, before any handler logic runs.

```jsonc
// Request
{ "message": "hello", "meta": { "lang": "en" } } // meta is optional

// 200 response
{ "received": { "message": "hello", "meta": { "lang": "en" } } }
```

Invalid payloads return `400` with a structured error envelope:

```jsonc
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "Request payload failed validation",
    "issues": [{ "path": "message", "message": "Message is required", "code": "too_small" }]
  }
}
```

Inbound object schemas are `.strict()`, so unexpected keys are rejected.

## Project structure

```
.
├── .github/workflows/ci.yml  # CI: npm ci + npm test on Node 18/20/22
├── package.json
├── README.md
├── src
│   ├── app.js              # Express app factory and routes (wired to validation)
│   ├── index.js            # Server bootstrap and lifecycle
│   ├── validation.js       # validate() helper + ValidationError + error mapper
│   └── schemas/            # zod schema registry (pre-compiled, reused per request)
│       ├── primitives.js   # email, id, pagination, timestamp, text
│       ├── echo.js         # EchoBodySchema
│       └── index.js        # barrel export
└── test/                    # node:test unit + integration tests
```

## Validation

Runtime payload validation is centralized in `src/schemas/` and enforced via the
`validate(schema, payload)` helper in `src/validation.js`. Schemas are
constructed once at module load and reused across requests — never rebuild a
schema inside a handler. To validate a new endpoint, define or compose a schema
in `src/schemas/` and call `validate(...)` at the top of the route handler,
passing the resulting `data` downstream.

## Testing

```bash
npm test
```

Uses Node's built-in test runner (`node --test`). Unit tests live in
`test/primitives.test.js` (schema fixtures + validation helper) and HTTP
integration tests in `test/echo.test.js` (assert 200/400 responses).

## License

MIT
