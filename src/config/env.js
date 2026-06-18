"use strict";

/**
 * Centralized, env-driven configuration. All secrets and tunables are read here
 * once and validated at startup so the rest of the codebase can rely on a
 * fully-formed config object.
 *
 * Design rationale: the auth service must obtain its secrets from the
 * environment (never from the repo) and fail loudly if a required secret is
 * missing in production. Defaults are only acceptable for local development.
 */

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

function requireSecret(name, value) {
  if (!value || typeof value !== "string") {
    if (IS_PROD) {
      throw new Error(
        `Missing required secret ${name}: set it in the environment before running in production.`
      );
    }
    // In non-prod, fall back to an obviously-insecure dev value so the app
    // still boots for local development and tests.
    return `dev-insecure-${name.toLowerCase()}`;
  }
  return value;
}

const config = {
  env: NODE_ENV,
  isProd: IS_PROD,
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",

  jwt: {
    accessSecret: requireSecret("JWT_SECRET", process.env.JWT_SECRET),
    refreshSecret: requireSecret(
      "JWT_REFRESH_SECRET",
      process.env.JWT_REFRESH_SECRET
    ),
    accessTtl: process.env.ACCESS_TTL || "15m",
    refreshTtl: process.env.REFRESH_TTL || "7d",
    // Seconds of leeway to absorb clock skew between sign and verify.
    clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || "5", 10),
  },

  // bcrypt cost factor. >=12 recommended for production.
  hashCost: parseInt(process.env.HASH_COST || "12", 10),

  // Rate limit tuning for auth endpoints.
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
    // Per (email || ip) bucket for login attempts.
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || "10", 10),
    // Per-ip bucket for registration.
    registerMax: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || "5", 10),
  },
};

module.exports = config;
