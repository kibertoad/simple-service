"use strict";

const { Router } = require("express");
const { z } = require("zod");
const passport = require("passport");
const { UnauthorizedError, ConflictError } = require("../errors");
const config = require("../config/env");

/**
 * Build the auth router.
 *
 * @param {object} deps
 * @param {object} deps.authService
 * @param {object} deps.tokenService
 * @param {object} deps.refreshStore
 * @param {object} deps.userRepository
 * @param {import("passport").PassportStatic} [deps.passport]
 * @param {Function} [deps.requireAuth]
 * @param {Function} [deps.loginLimiter]
 * @param {Function} [deps.registerLimiter]
 * @returns {import("express").Router}
 */
function buildAuthRouter({
  authService,
  tokenService,
  refreshStore,
  userRepository,
  passport: pp = passport,
  requireAuth,
  loginLimiter,
  registerLimiter,
}) {
  const router = Router();

  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    roles: z.array(z.string()).optional(),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const refreshSchema = z.object({
    refreshToken: z.string().min(1),
  });

  // --- POST /auth/register ---
  if (registerLimiter) router.use("/register", registerLimiter());

  router.post("/register", async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const e = new Error("Validation failed");
        e.name = "ZodError";
        e.issues = parsed.error.issues;
        throw e;
      }
      const { email, password, roles } = parsed.data;
      const user = await authService.register(email, password, roles || []);
      res.status(201).json({ userId: user.id, email: user.email, roles: user.roles });
    } catch (err) {
      next(err);
    }
  });

  // --- POST /auth/login (passport-local) ---
  if (loginLimiter) router.use("/login", loginLimiter());

  router.post("/login", (req, res, next) => {
    pp.authenticate("local", { session: false }, async (err, user, info) => {
      try {
        if (err) return next(err);
        if (!user) {
          return next(new UnauthorizedError("Invalid credentials"));
        }
        const accessToken = tokenService.signAccess(user);
        const refreshToken = tokenService.signRefresh(user);
        await refreshStore.add(
          refreshToken,
          user.id,
          tokenService.ttlSeconds(config.jwt.refreshTtl)
        );
        res.status(200).json({
          accessToken,
          refreshToken,
          expiresIn: config.jwt.accessTtl,
        });
      } catch (e) {
        next(e);
      }
    })(req, res, next);
  });

  // --- POST /auth/refresh (rotate-on-use + reuse detection) ---
  router.post("/refresh", async (req, res, next) => {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        const e = new Error("Validation failed");
        e.name = "ZodError";
        e.issues = parsed.error.issues;
        throw e;
      }
      const { refreshToken } = parsed.data;

      const payload = tokenService.verifyRefresh(refreshToken);
      if (!payload || !payload.sub) {
        return next(new UnauthorizedError("Invalid refresh token"));
      }

      const stored = await refreshStore.get(refreshToken);
      if (!stored) {
        // Reuse detection: a valid-but-not-in-store token means it was already
        // consumed or revoked. Treat as compromise → invalidate the whole chain.
        await refreshStore.removeAllForUser(payload.sub);
        return next(new UnauthorizedError("Refresh token reuse detected"));
      }
      if (stored.userId !== payload.sub) {
        await refreshStore.removeAllForUser(payload.sub);
        return next(new UnauthorizedError("Invalid refresh token"));
      }

      // Rotate: consume the old token, issue a new pair.
      await refreshStore.remove(refreshToken);
      const user = await userRepository.findById(payload.sub);
      if (!user) {
        return next(new UnauthorizedError("Invalid refresh token"));
      }
      const newAccessToken = tokenService.signAccess(user);
      const newRefreshToken = tokenService.signRefresh(user);
      await refreshStore.add(
        newRefreshToken,
        user.id,
        tokenService.ttlSeconds(config.jwt.refreshTtl)
      );
      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: config.jwt.accessTtl,
      });
    } catch (err) {
      next(err);
    }
  });

  // --- POST /auth/logout (requires valid access token; removes refresh chain) ---
  router.post("/logout", requireAuth, async (req, res, next) => {
    try {
      // Logout is stateless for access tokens (client discards); we revoke the
      // refresh chain server-side so refresh can no longer be used.
      const userId = req.user && req.user.id;
      if (userId) {
        await refreshStore.removeAllForUser(userId);
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // --- GET /auth/me (requires valid access token) ---
  router.get("/me", requireAuth, async (req, res, next) => {
    try {
      const user = await userRepository.findById(req.user.id);
      if (!user) return next(new UnauthorizedError("User no longer exists"));
      res.status(200).json({
        userId: user.id,
        email: user.email,
        roles: user.roles || [],
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { buildAuthRouter };
