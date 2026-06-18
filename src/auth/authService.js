"use strict";

const bcrypt = require("bcryptjs");
const config = require("../config/env");
const { ConflictError, ServiceUnavailableError } = require("../errors");

/**
 * AuthService — credential validation, password hashing/verification, user
 * creation.
 *
 * Dependencies are injected (userRepository) so the service is testable and
 * not bound to a specific persistence backend.
 */
class AuthService {
  /**
   * @param {{ findByEmail: Function, findById: Function, create: Function }} userRepository
   */
  constructor(userRepository) {
    if (!userRepository) throw new Error("userRepository is required");
    this.userRepository = userRepository;
  }

  /** Hash a plaintext password with bcrypt at the configured cost. */
  async hashPassword(password) {
    this._validatePassword(password);
    const salt = await bcrypt.genSalt(config.hashCost);
    return bcrypt.hash(password, salt);
  }

  /** Constant-time-ish password verification via bcrypt.compare. */
  async verifyPassword(password, hash) {
    if (typeof password !== "string" || typeof hash !== "string" || !hash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Register a new user. Returns the public user view (no passwordHash).
   * @returns {Promise<{ id, email, roles }>}
   */
  async register(email, password, roles = []) {
    this._validatePassword(password);
    const passwordHash = await this.hashPassword(password);
    try {
      const user = await this.userRepository.create({
        email,
        passwordHash,
        roles,
      });
      return this.toPublicUser(user);
    } catch (err) {
      // Propagate typed conflicts (409) verbatim; wrap store failures as 503.
      if (err && err.name === "ConflictError") throw err;
      throw new ServiceUnavailableError("User store unavailable");
    }
  }

  /**
   * Validate credentials. Returns the user on success or null on failure.
   * Failures are uniform (no "user not found" vs "bad password" distinction)
   * to avoid user enumeration.
   */
  async authenticate(email, password) {
    if (typeof email !== "string" || typeof password !== "string") return null;
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    const ok = await this.verifyPassword(password, user.passwordHash);
    if (!ok) return null;
    return user;
  }

  /** Strip passwordHash for safe transport. */
  toPublicUser(user) {
    if (!user) return null;
    return { id: user.id, email: user.email, roles: [...(user.roles || [])] };
  }

  _validatePassword(password) {
    if (typeof password !== "string" || password.length < 8) {
      // Surface as a validation error via the generic error handler.
      const err = new Error("password must be at least 8 characters");
      err.name = "ZodError";
      err.issues = [{ path: ["password"], message: "password must be at least 8 characters" }];
      throw err;
    }
    if (password.length > 72) {
      // bcrypt truncates at 72 bytes; reject longer to avoid silent truncation.
      const err = new Error("password must be at most 72 characters");
      err.name = "ZodError";
      err.issues = [{ path: ["password"], message: "password must be at most 72 characters" }];
      throw err;
    }
  }
}

module.exports = { AuthService };
