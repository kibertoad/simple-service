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

| Method | Path            | Description                                              |
| ------ | --------------- | -------------------------------------------------------- |
| GET    | `/`             | Returns a greeting JSON message.                         |
| GET    | `/health`       | Health check endpoint.                                   |
| POST   | `/echo`         | Echoes back the JSON body you send.                      |
| POST   | `/users`        | Creates a new User with a system-generated UUID.         |
| PUT    | `/users/:id`    | Fully replaces an existing User record.                  |

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

## Error responses

| Status | Situation                              | Example message                                |
| ------ | -------------------------------------- | ---------------------------------------------- |
| 400    | Missing/invalid fields or malformed id | `{ "error": "name is required", ... }`         |
| 404    | Target User does not exist on PUT      | `{ "error": "User not found", "code": "..." }` |
| 409    | Email already in use                   | `{ "error": "Email already in use", ... }`     |

## Persistence

User data is stored in memory only. When the process restarts, all persisted
User records are lost.

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
│   │   ├── errors.js
│   │   ├── user.js
│   │   └── user.test.js
│   ├── index.js
│   ├── routes
│   │   └── users.js
│   ├── service
│   │   ├── userService.js
│   │   └── userService.test.js
│   └── store
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
