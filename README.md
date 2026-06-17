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

| Method | Path      | Description                          |
| ------ | --------- | ------------------------------------ |
| GET    | `/`       | Returns a greeting JSON message.     |
| GET    | `/health` | Health check endpoint.               |
| POST   | `/echo`   | Echoes back the JSON body you send.  |

## Project structure

```
.
├── package.json
├── README.md
└── src
    ├── app.js     # Express app factory and routes
    └── index.js   # Server bootstrap and lifecycle
```

## License

MIT
