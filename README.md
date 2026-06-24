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

| Method | Path            | Description                                              |
| ------ | --------------- | -------------------------------------------------------- |
| GET    | `/`             | Returns a greeting JSON message.                         |
| GET    | `/health`       | Health check endpoint.                                   |
| POST   | `/echo`         | Echoes back the JSON body you send.                      |
| POST   | `/users`        | Creates a new User with a system-generated UUID.         |
| PUT    | `/users/:id`    | Fully replaces an existing User record.                  |
| POST   | `/bears`        | Creates a new Bear with a system-generated UUIDv7 id.    |
| GET    | `/bears`        | Lists Bears using cursor-based pagination.               |
| GET    | `/bears/:id`    | Retrieves a single Bear by id.                           |
| PUT    | `/bears/:id`    | Fully replaces an existing Bear's mutable fields.        |
| DELETE | `/bears/:id`    | Deletes a Bear by id.                                    |

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

## Error responses

| Status | Situation                                        | Example message                                      |
| ------ | ------------------------------------------------ | ---------------------------------------------------- |
| 400    | Missing/invalid fields, malformed id, malformed cursor, or invalid limit | `{ "error": "name is required", ... }` |
| 404    | Target does not exist                            | `{ "error": "Bear/User not found", "code": "..." }`  |
| 409    | Unique key (email/name) already in use           | `{ "error": "Email/Name already in use", ... }`      |

## Persistence

User and Bear data is stored in memory only. When the process restarts, all persisted
records are lost.

## Project structure

```
.
├── package.json
├── README.md
├── spec
│   ├── features
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
│   │   ├── user.js
│   │   └── user.test.js
│   ├── index.js
│   ├── routes
│   │   ├── bears.js
│   │   ├── organizations.js
│   │   └── users.js
│   ├── service
│   │   ├── bearService.js
│   │   ├── bearService.test.js
│   │   ├── organizationService.js
│   │   ├── organizationService.test.js
│   │   ├── userService.js
│   │   └── userService.test.js
│   └── store
│       ├── bearStore.js
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

## License

MIT
