# user-service

A minimal in-memory user management service built with Express.js. It exposes
REST endpoints to create users and fully replace existing user records.

## Prerequisites

- Node.js >= 18 (the `uuid` package provides UUIDv7 support for all supported versions)

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

| Method | Path                     | Description                                                            |
| ------ | ------------------------ | ---------------------------------------------------------------------- |
| GET    | `/`                      | Returns a greeting JSON message.                                       |
| GET    | `/health`                | Health check endpoint.                                                 |
| POST   | `/echo`                  | Echoes back the JSON body you send.                                    |
| POST   | `/users`                 | Creates a new User with a system-generated UUID.                       |
| PUT    | `/users/:id`             | Fully replaces an existing User record.                                |
| POST   | `/bears`                 | Creates a new Bear with a system-generated UUIDv7 id.                  |
| GET    | `/bears`                 | Lists Bears using cursor-based pagination.                             |
| GET    | `/bears/:id`             | Retrieves a single Bear by id.                                         |
| PUT    | `/bears/:id`             | Fully replaces an existing Bear's mutable fields.                      |
| DELETE | `/bears/:id`             | Deletes a Bear by id.                                                  |
| POST   | `/office-tables`         | Creates a new Office Table with a system-generated UUIDv7.             |
| GET    | `/office-tables`         | Lists Office Tables with cursor-based pagination.                      |
| GET    | `/office-tables/:id`     | Retrieves an Office Table by its UUIDv7 identifier.                    |
| PUT    | `/office-tables/:id`     | Fully replaces an existing Office Table record.                        |
| DELETE | `/office-tables/:id`     | Deletes an Office Table by its UUIDv7 identifier.                      |

## User resource

A User is represented with exactly three fields:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice",
  "email": "alice@example.com"
}
```

- `id` — immutable, system-generated UUID. Clients must not supply or modify it.
- `name` — required string.
- `email` — required string, unique across all Users.

## Bear resource

A Bear is represented with exactly four fields:

```json
{
  "id": "0190a1b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b",
  "name": "Paddington",
  "age": 5,
  "colour": "brown"
}
```

- `id` — immutable, system-generated UUIDv7 identifier. Clients must not supply or modify it.
- `name` — required non-empty string, unique across all Bears, no more than 100 characters, and must match `NAME_PATTERN`:
  `/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'\-]{0,99}$/u`
  (Unicode letter/mark/number start; spaces, periods, apostrophes, and hyphens allowed).
- `age` — required non-negative integer.
- `colour` — freeform string; may be omitted, in which case an empty string is stored.

## Create a User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'
```

Response (`201 Created`):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice",
  "email": "alice@example.com"
}
```

Extra fields are discarded and any client-supplied `id` is ignored.

## Create a Bear

```bash
curl -X POST http://localhost:3000/bears \
  -H "Content-Type: application/json" \
  -d '{"name": "Paddington", "age": 5, "colour": "brown"}'
```

Response (`201 Created`):

```json
{
  "id": "0190a1b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b",
  "name": "Paddington",
  "age": 5,
  "colour": "brown"
}
```

The `id` is a UUIDv7 generated locally. Extra fields are discarded and any client-supplied `id` is ignored.

## List Bears

```bash
curl "http://localhost:3000/bears?limit=10"
```

Response (`200 OK`):

```json
{
  "data": [ /* up to 10 Bear records */ ],
  "nextCursor": "eyJpZCI6Ii4uLiJ9"
}
```

Use `?cursor=...` to fetch subsequent pages. The default `limit` is 50 and the maximum is 100.

## Replace a Bear

```bash
curl -X PUT "http://localhost:3000/bears/0190a1b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pooh", "age": 10, "colour": "yellow"}'
```

Response (`200 OK`):

```json
{
  "id": "0190a1b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b",
  "name": "Pooh",
  "age": 10,
  "colour": "yellow"
}
```

The `id` is immutable and is taken from the URL; any `id` in the request body is ignored. The body must contain valid `name` and `age` values. Omitted `colour` is stored as an empty string.

> Note on omitted fields: the spec requires full replacement semantics, meaning the request representation supersedes the previous mutable state. Name and age remain mandatory on update because update must satisfy all creation validation rules; colour is the only mutable field that may be omitted, defaulting to `""`.

## Delete a Bear

```bash
curl -X DELETE "http://localhost:3000/bears/0190a1b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b"
```

Response (`204 No Content`).

## Replace a User

```bash
curl -X PUT "http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Smith",
    "email": "alice.smith@example.com"
  }'
```

Response (`200 OK`):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice Smith",
  "email": "alice.smith@example.com"
}
```

The `id` in the request body must match the `id` in the URL. The request body
must contain all three User fields. Extra fields are discarded.

## User error responses

| Status | Situation                                        | Example message                                      |
| ------ | ------------------------------------------------ | ---------------------------------------------------- |
| 400    | Missing/invalid fields, malformed id, malformed cursor, or invalid limit | `{ "error": "name is required", ... }` |
| 404    | Target does not exist                            | `{ "error": "Bear/User not found", "code": "..." }`  |
| 409    | Unique key (email/name) already in use           | `{ "error": "Email/Name already in use", ... }`      |

## User persistence

User and Bear data is stored in memory only. When the process restarts, all persisted
records are lost.

## Office Table resource

An Office Table (physical furniture) is represented with exactly three fields:

```json
{
  "id": "0193e272-5b18-7ff9-a1a2-123456789abc",
  "price": 250,
  "dateBought": "2026-06-23"
}
```

- `id` — immutable, system-generated UUIDv7. Clients must not supply or modify it.
- `price` — required non-negative finite number.
- `dateBought` — required string. JSON key is camelCase (`dateBought`) despite
the descriptive requirement "date bought".

## Create an Office Table

```bash
curl -X POST http://localhost:3000/office-tables \
  -H "Content-Type: application/json" \
  -d '{"price": 250, "dateBought": "2026-06-23"}'
```

Response (`201 Created`):

```json
{
  "id": "0193e272-5b18-7ff9-a1a2-123456789abc",
  "price": 250,
  "dateBought": "2026-06-23"
}
```

Extra fields are discarded, any client-supplied `id` is ignored, and a negative
`price` is rejected with `400 Bad Request`.

## Retrieve an Office Table

```bash
curl http://localhost:3000/office-tables/0193e272-5b18-7ff9-a1a2-123456789abc
```

Response (`200 OK`) with the Office Table record directly in the body.
A malformed id returns `400 Bad Request`; a missing id returns `404 Not Found`.

## List Office Tables

```bash
curl 'http://localhost:3000/office-tables?limit=10'
```

Response (`200 OK`) is a direct JSON array of Office Tables. If more results are
available, the response includes an `X-Next-Cursor` header containing an opaque
cursor to supply as the `cursor` query parameter on the next request.

## Replace an Office Table

```bash
curl -X PUT http://localhost:3000/office-tables/0193e272-5b18-7ff9-a1a2-123456789abc \
  -H "Content-Type: application/json" \
  -d '{"price": 199, "dateBought": "2026-07-01"}'
```

Response (`200 OK`) with the updated record. This is a full replacement — the
stored resource is overwritten with exactly the supplied `price` and
`dateBought`. The `id` is taken from the URL path only; any `id` supplied in
the request body is ignored. This differs from the User and Organization
endpoints, which require a matching `id` in the request body.

## Delete an Office Table

```bash
curl -X DELETE http://localhost:3000/office-tables/0193e272-5b18-7ff9-a1a2-123456789abc
```

Response (`204 No Content`) on success.

## Office Table field naming

The data model calls the field "date bought" descriptively. The JSON property
name used by the API is `dateBought` (camelCase). Clients should send and
expect that key spelling.

## Office Table error responses

| Status | Situation                               | Example message                                 |
| ------ | --------------------------------------- | ----------------------------------------------- |
| 400    | Missing/invalid fields or malformed id  | `{ "error": "price must be non-negative" }`     |
| 404    | Target Office Table does not exist      | `{ "error": "Office table not found" }`         |
| 405    | HTTP method not allowed on this path    | `{ "error": "Method Not Allowed" }`             |

## Office Table persistence

Office Table data is stored in memory only. When the process restarts, all
persisted Office Table records are lost. Endpoint URLs do not contain a version
prefix (for example, `/v1/` is not used).

## Project structure

```
.
├── package.json
├── README.md
├── spec
│   ├── features
│   │   └── office-table-management.feature
│   │   └── user-management.feature
│   ├── overview.md
│   ├── rules.md
│   └── spec.json
├── src
│   ├── app.js
│   ├── domain
│   │   ├── bear.js
│   │   ├── bear.test.js
│   │   ├── errors.js
│   │   ├── officeTable.js
│   │   ├── officeTable.test.js
│   │   ├── user.js
│   │   └── user.test.js
│   ├── index.js
│   ├── routes
│   │   ├── bears.js
│   │   ├── officeTables.js
│   │   ├── organizations.js
│   │   └── users.js
│   ├── service
│   │   ├── bearService.js
│   │   ├── bearService.test.js
│   │   ├── officeTableService.js
│   │   ├── officeTableService.test.js
│   │   ├── organizationService.js
│   │   ├── organizationService.test.js
│   │   ├── userService.js
│   │   └── userService.test.js
│   └── store
│       ├── bearStore.js
│       ├── officeTable.js
│       ├── organizationStore.js

│       └── userStore.js
└── test
    └── app.test.js
```

## Development

Run all tests:

```bash
npm test
```

Run unit tests only:

```bash
npm run test:unit
```

Run HTTP-level integration tests only:

```bash
npm run test:integration
```

## Running locally with Docker Compose

This service has no external service dependencies, so no WireMock stubs are
required. A plain `docker-compose up` builds and starts the service.

```bash
docker-compose up --build
```

The health check waits for the service to respond on `http://localhost:3000/health`.

### CI

The same Docker Compose setup can be used in CI; there are no mock services to
start or external base URLs to configure. For example, in GitHub Actions:

```yaml
- run: docker-compose up --build -d
- run: |
    for i in {1..30}; do
      curl -sf http://localhost:3000/health && break
      sleep 1
    done
- run: curl -sf http://localhost:3000/office-tables
```

## License

MIT
