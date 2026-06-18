"use strict";

const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { UnauthorizedError } = require("../errors");

/**
 * Configure the passport-local and passport-jwt strategies on a passport
 * instance. Both strategies are stateless (`{ session: false }`).
 *
 * @param {object} deps
 * @param {import("passport").PassportStatic} [deps.passport] defaults to the global passport
 * @param {object} deps.authService AuthService instance (must expose authenticate)
 * @param {object} deps.userRepository must expose findById
 * @param {object} deps.tokenService must expose verify + accessSecret via config
 * @param {{ accessSecret: string, clockTolerance: number }} deps.jwtConfig
 */
function configurePassport({
  passport: pp = passport,
  authService,
  userRepository,
  jwtConfig,
}) {
  if (!authService) throw new Error("authService is required");
  if (!userRepository) throw new Error("userRepository is required");
  if (!jwtConfig) throw new Error("jwtConfig is required");

  // --- Local strategy: email + password on POST /auth/login ---
  pp.use(
    "local",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password", session: false },
      async (email, password, done) => {
        try {
          const user = await authService.authenticate(email, password);
          if (!user) {
            // Uniform failure to avoid enumeration.
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // --- JWT strategy: Authorization: Bearer on protected routes ---
  pp.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: jwtConfig.accessSecret,
        algorithms: ["HS256"],
        // Absorb small clock skew.
        clockTolerance: jwtConfig.clockTolerance || 0,
        passReqToCallback: true,
      },
      async (req, payload, done) => {
        try {
          if (!payload || !payload.sub) {
            return done(null, false);
          }
          // Re-fetch the user so role changes are reflected (short access TTL
          // bounds staleness). If the user was deleted, reject.
          const user = await userRepository.findById(payload.sub);
          if (!user) return done(null, false);
          // Attach the full user record for handlers/role middleware.
          return done(null, {
            id: user.id,
            email: user.email,
            roles: user.roles || [],
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  return pp;
}

module.exports = { configurePassport };
