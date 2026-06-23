# user-service

A minimal in-memory user management service built with Express.js. It exposes
REST endpoints to create users and fully replace existing user records.

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

| Method | Path                     | Description                                                            |
| ------ | ------------------------ | ---------------------------------------------------------------------- |
| GET    | `/`                      | Returns a greeting JSON message.                                       |
| GET    | `/health`                | Health check endpoint.                                                 |
| POST   | `/echo`                  | Echoes back the JSON body you send.                                    |
| POST   | `/users`                 | Creates a new User with a system-generated UUID.                       |
| PUT    | `/users/:id`             | Fully replaces an existing User record.                                |
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

| Status | Situation                              | Example message                                |
| ------ | -------------------------------------- | ---------------------------------------------- |
| 400    | Missing/invalid fields or malformed id | `{ "error": "name is required", ... }`         |
| 404    | Target User does not exist on PUT      | `{ "error": "User not found", "code": "..." }` |
| 409    | Email already in use                   | `{ "error": "Email already in use", ... }`     |

## User persistence

User data is stored in memory only. When the process restarts, all persisted
User records are lost.

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
- `dateBought` — required string.

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
`dateBought`.

## Delete an Office Table

```bash
curl -X DELETE http://localhost:3000/office-tables/0193e272-5b18-7ff9-a1a2-123456789abc
```

Response (`204 No Content`) on success.

## Office Table error responses

| Status | Situation                               | Example message                                 |
| ------ | --------------------------------------- | ----------------------------------------------- |
| 400    | Missing/invalid fields or malformed id  | `{ "error": "price must be non-negative" }`     |
| 404    | Target Office Table does not exist      | `{ "error": "Office table not found" }`         |

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
│   │   ├── errors.js
│   │   ├── officeTable.js
│   │   ├── officeTable.test.js
│   │   ├── user.js
│   │   └── user.test.js
│   ├── index.js
│   ├── routes
│   │   ├── officeTables.js
│   │   └── users.js
│   ├── service
│   │   ├── officeTableService.js
│   │   ├── officeTableService.test.js
│   │   ├── userService.js
│   │   └── userService.test.js
│   └── store
│       ├── officeTable.js
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

## License

MIT
