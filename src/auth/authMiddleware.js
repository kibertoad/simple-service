"use strict";

const rateLimit = require("express-rate-limit");
const passport = require("passport");
const { UnauthorizedError, ForbiddenError } = require("../errors");
const config = require("../config/env");

/**
 * Auth middleware helpers.
 *
 * - requireAuth: applies `passport.authenticate('jwt', { session: false })`
 *   to protected routes; converts passport's default 401 into our JSON shape.
 * - requireRole(...roles): enforces RBAC; must run after requireAuth.
 * - loginLimiter / registerLimiter: per-(email||ip) and per-ip rate limits.
 */

/**
 * Wrap passport.authenticate so failures emit our uniform JSON error.
 */
function requireAuth(passportInstance = passport) {
  return (req, res, next) => {
    passportInstance.authenticate("jwt", { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        const msg =
          info && info.message ? info.message : "Invalid or missing token";
        return next(new UnauthorizedError(msg));
      }
      req.user = user;
      return next();
    })(req, res, next);
  };
}

/**
 * Role guard. Requires `req.user` to be populated (i.e. used after
 * requireAuth). Denies with 403 if the user lacks any of the allowed roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(new UnauthorizedError("Authentication required"));
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole =
      allowedRoles.length === 0 ||
      allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) return next(new ForbiddenError("Insufficient role"));
    return next();
  };
}

/** Rate limiter for /auth/login — keyed by email (fallback ip) to slow brute force. */
function loginLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    // Key by email when present so a single account's brute-force is throttled
    // regardless of source IP; fall back to the validated IP otherwise.
    keyGenerator: (req, res) => {
      const email = req.body && req.body.email;
      if (typeof email === "string" && email) {
        return `login:${email.toLowerCase()}`;
      }
      return rateLimit.ipKeyGenerator(req, res);
    },
    message: { error: "Too many login attempts, try again later.", code: "rate_limited" },
  });
}

/** Rate limiter for /auth/register — keyed by ip. */
function registerLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.registerMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => rateLimit.ipKeyGenerator(req, res),
    message: { error: "Too many registrations, try again later.", code: "rate_limited" },
  });
}

module.exports = {
  requireAuth,
  requireRole,
  loginLimiter,
  registerLimiter,
};
