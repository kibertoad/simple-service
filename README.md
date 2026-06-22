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

| Method | Path           | Description                                                           |
| ------ | -------------- | --------------------------------------------------------------------- |
| GET    | `/`            | Returns a greeting JSON message.                                      |
| GET    | `/health`      | Health check endpoint.                                                |
| POST   | `/echo`        | Echoes back the JSON body you send.                                   |
| POST   | `/users`       | Create a new user. Returns the created user (no password).            |
| GET    | `/users`       | List users with pagination (`limit`, `offset`), `role`, and `q`.      |
| GET    | `/users/:id`   | Get a single user by ID.                                              |
| PATCH  | `/users/:id`   | Partially update a user.                                              |
| DELETE | `/users/:id`   | Delete a user by ID.                                                  |

All user data is stored in memory and is lost when the process restarts.
There is no authentication or authorization on these endpoints.

## Project structure

```
.
├── package.json
├── README.md
├── spec           # Prescriptive requirements
├── src
│   ├── app.js               # Express app factory and routes
│   ├── index.js             # Server bootstrap and lifecycle
│   └── users
│       ├── errors.js        # User domain errors
│       ├── UserService.js   # In-memory user CRUD logic
│       └── userRoutes.js    # /users Express router
└── test
    ├── users.service.test.js  # Unit tests for UserService
    └── users.routes.test.js   # HTTP tests for /users endpoints
```

## License

MIT
