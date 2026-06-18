"use strict";

/**
 * Auth wiring factory.
 *
 * Assembles the auth building block from its dependencies. All collaborators
 * are injectable so the block is testable; defaults (in-memory user + refresh
 * stores, the global passport instance) are provided for local dev/tests.
 *
 * Per the design: UserRepository and RefreshStore are pluggable. In production
 * you would pass Mongo/Postgres + Redis-backed implementations respectively.
 */

const passport = require("passport");
const config = require("../config/env");
const { AuthService } = require("./authService");
const { TokenService } = require("./tokenService");
const { InMemoryUserRepository } = require("./userRepository");
const { InMemoryRefreshStore } = require("./refreshStore");
const { configurePassport } = require("./passportStrategies");
const { buildAuthRouter } = require("./authController");
const {
  requireAuth: makeRequireAuth,
  requireRole,
  loginLimiter,
  registerLimiter,
} = require("./authMiddleware");

/**
 * @param {object} [overrides]
 * @param {object} [overrides.userRepository]
 * @param {object} [overrides.refreshStore]
 * @param {object} [overrides.authService]
 * @param {object} [overrides.tokenService]
 * @param {import("passport").PassportStatic} [overrides.passport]
 * @returns {{
 *   router: import("express").Router,
 *   passport: import("passport").PassportStatic,
 *   requireAuth: Function,
 *   requireRole: Function,
 *   authService: object,
 *   tokenService: object,
 *   userRepository: object,
 *   refreshStore: object,
 * }}
 */
function createAuth(overrides = {}) {
  const pp = overrides.passport || passport;

  const userRepository =
    overrides.userRepository || new InMemoryUserRepository();
  const refreshStore = overrides.refreshStore || new InMemoryRefreshStore();

  const authService =
    overrides.authService || new AuthService(userRepository);
  const tokenService =
    overrides.tokenService || new TokenService(config.jwt);

  // Register the local + jwt strategies on this passport instance.
  configurePassport({
    passport: pp,
    authService,
    userRepository,
    jwtConfig: config.jwt,
  });

  const requireAuth = makeRequireAuth(pp);

  const router = buildAuthRouter({
    authService,
    tokenService,
    refreshStore,
    userRepository,
    passport: pp,
    requireAuth,
    loginLimiter,
    registerLimiter,
  });

  return {
    router,
    passport: pp,
    requireAuth,
    requireRole,
    authService,
    tokenService,
    userRepository,
    refreshStore,
  };
}

module.exports = { createAuth };
