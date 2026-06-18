"use strict";

/**
 * UserRepository — pluggable persistence for users.
 *
 * Interface (implemented by any concrete store):
 *   findByEmail(email): Promise<User | null>
 *   findById(id): Promise<User | null>
 *   create({ email, passwordHash, roles }): Promise<User>
 *
 * User shape:
 *   { id: string, email: string, passwordHash: string, roles: string[] }
 *
 * Design rationale: the auth block should not hard-depend on a specific DB.
 * The in-memory implementation below is suitable for tests and local dev; a
 * Mongo/Postgres implementation can be dropped in behind the same interface.
 */

/**
 * Generate a reasonably unique id without a uuid dependency.
 * crypto.randomUUID is available on Node >= 14.17.
 */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

class InMemoryUserRepository {
  constructor() {
    /** @type {Map<string, User>} keyed by id */
    this._byId = new Map();
    /** @type {Map<string, string>} lowercased email -> id */
    this._byEmail = new Map();
  }

  async findByEmail(email) {
    if (typeof email !== "string") return null;
    const id = this._byEmail.get(email.toLowerCase());
    if (!id) return null;
    return this._byId.get(id) || null;
  }

  async findById(id) {
    return this._byId.get(id) || null;
  }

  async create({ email, passwordHash, roles = [] }) {
    if (typeof email !== "string" || !email.trim()) {
      throw new Error("email is required");
    }
    if (typeof passwordHash !== "string" || !passwordHash) {
      throw new Error("passwordHash is required");
    }
    const normalized = email.toLowerCase();
    if (this._byEmail.has(normalized)) {
      // Surface as a typed conflict so the controller can map to 409.
      const { ConflictError } = require("../errors");
      throw new ConflictError("Email already registered");
    }
    const user = {
      id: generateId(),
      email,
      passwordHash,
      roles: Array.isArray(roles) ? [...roles] : [],
    };
    this._byId.set(user.id, user);
    this._byEmail.set(normalized, user.id);
    return user;
  }

  /** Test/dev helper: clear all users. */
  clear() {
    this._byId.clear();
    this._byEmail.clear();
  }
}

module.exports = {
  generateId,
  InMemoryUserRepository,
};
