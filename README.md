# simple-service

A minimal Express.js application with a Passport-based auth building block:
credential registration/login, JWT access + refresh tokens with rotation and
reuse detection, route protection, and role enforcement.

## Prerequisites

- Node.js >= 18

## Installation

```bash
npm install
```

## Configuration

All secrets and tunables come from the environment. Copy `.env.example` to
`.env` and fill in strong secrets for local development:

```bash
cp .env.example .env
```

| Variable             | Default                | Description                                            |
| -------------------- | ---------------------- | ------------------------------------------------------ |
| `JWT_SECRET`         | dev fallback (non-prod)| Secret used to sign **access** tokens.                 |
| `JWT_REFRESH_SECRET` | dev fallback (non-prod)| Secret used to sign **refresh** tokens (must differ).  |
| `ACCESS_TTL`         | `15m`                  | Access token lifetime (jsonwebtoken `expiresIn`).      |
| `REFRESH_TTL`        | `7d`                   | Refresh token lifetime.                                |
| `HASH_COST`          | `12`                   | bcrypt cost factor (≥12 recommended).                  |
| `JWT_CLOCK_TOLERANCE`| `5`                    | Seconds of leeway for JWT verify (clock skew).         |
| `RATE_LIMIT_*`       | see `.env.example`     | Rate-limit tuning for auth endpoints.                  |
| `PORT` / `HOST`      | `3000` / `0.0.0.0`     | Server bind config.                                    |

> **Production:** `JWT_SECRET` and `JWT_REFRESH_SECRET` are required and the app
> will refuse to boot without them when `NODE_ENV=production`. Generate strong
> secrets with e.g. `openssl rand -hex 32`.

## Usage

```bash
npm start      # start the server
npm run dev    # start with auto-reload (Node 18.11+)
npm test       # run the test suite
```

## Endpoints

### Public

| Method | Path     | Body                       | Response                                         |
| ------ | -------- | -------------------------- | ------------------------------------------------ |
| GET    | `/`      | —                          | `{ message: "Hello, Express!" }`                 |
| GET    | `/health`| —                          | `{ status: "ok" }`                               |
| POST   | `/echo`  | any JSON                   | `{ received: <body> }`                           |

### Auth

| Method | Path            | Auth | Body / Header                                  | Response |
| ------ | --------------- | ---- | ---------------------------------------------- | -------- |
| POST   | `/auth/register`| —    | `{ email, password, roles? }`                  | `201 { userId, email, roles }` |
| POST   | `/auth/login`   | —    | `{ email, password }`                          | `200 { accessToken, refreshToken, expiresIn }` |
| POST   | `/auth/refresh` | —    | `{ refreshToken }`                             | `200 { accessToken, refreshToken, expiresIn }` (rotated) |
| POST   | `/auth/logout`  | Bearer | `Authorization: Bearer <accessToken>`        | `204` (revokes the refresh chain) |
| GET    | `/auth/me`      | Bearer | `Authorization: Bearer <accessToken>`        | `200 { userId, email, roles }` |

### Protected (example)

| Method | Path    | Auth                | Response |
| ------ | ------- | ------------------- | -------- |
| GET    | `/admin`| Bearer + `admin` role | `{ message: "Hello admin <email>" }` |

Protected routes require `Authorization: Bearer <accessToken>`. Access token
payload: `{ sub, email, roles }`.

## Design notes

- **Stateless:** access tokens are self-contained JWTs; protected routes verify
  offline. Refresh tokens are revocable via an allowlist (see below).
- **Password hashing:** bcrypt (cost ≥12). Passwords are validated at the
  boundary (8–72 chars; bcrypt truncates at 72 bytes).
- **Refresh rotation + reuse detection:** each refresh issues a new pair and
  consumes the old token. Presenting an already-consumed (revoked) refresh
  token is treated as theft and **invalidates the entire chain** for that user.
- **Pluggable backends:** `UserRepository` and `RefreshStore` are interfaces.
  The default implementations are in-memory (suitable for tests/local dev).
  Production should swap in a durable user store (e.g. Postgres/Mongo) and a
  Redis-backed refresh allowlist.
- **Rate limiting:** `/auth/login` is throttled per email (fallback IP);
  `/auth/register` per IP.
- **Errors:** uniform JSON `{ error, code }` shape; 400 for validation, 401 for
  auth failure, 403 for insufficient role, 409 for duplicate email, 503 for
  store failure, 429 for rate limits.

### Assumptions / follow-ups

- Hasher is `bcryptjs` (pure JS) for CI portability; `argon2id` is the modern
  recommended default and can be swapped behind `AuthService`.
- OAuth (Google/GitHub) is out of scope for this block (local-only), per design.
- Redis-backed `RefreshStore` and durable `UserRepository` are left as
  swappable implementations; wiring real backends is a follow-up.

## Project structure

```
.
├── src
│   ├── app.js                 # Express app factory + route mounting
│   ├── index.js               # Server bootstrap and lifecycle
│   ├── config
│   │   └── env.js             # Env-driven config + secret validation
│   ├── errors.js              # HttpError types + JSON error handler
│   └── auth
│       ├── index.js           # Auth wiring factory (createAuth)
│       ├── authService.js     # Hashing, register, authenticate
│       ├── tokenService.js    # JWT sign/verify (access + refresh)
│       ├── userRepository.js  # Pluggable user store (in-memory default)
│       ├── refreshStore.js    # Pluggable refresh allowlist (in-memory default)
│       ├── passportStrategies.js  # local + jwt strategies
│       ├── authMiddleware.js  # requireAuth, requireRole, rate limiters
│       └── authController.js  # /auth router (register/login/refresh/logout/me)
└── test
    └── auth.test.js           # End-to-end auth flow tests
```

## License

MIT
