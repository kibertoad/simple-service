"use strict";

/**
 * RefreshStore — allowlist of valid refresh tokens for revocation + rotation.
 *
 * Interface:
 *   add(token, userId, ttlSeconds): Promise<void>
 *   get(token): Promise<{ userId, expiresAt } | null>
 *   remove(token): Promise<void>
 *   removeAllForUser(userId): Promise<void>
 *
 * Design rationale: per the design doc, refresh tokens must be revocable. A
 * stateless JWT refresh token cannot be revoked before expiry, so we keep an
 * allowlist (Redis in production). The in-memory implementation here supports
 * TTL expiry and rotation semantics, and is swappable for a Redis-backed one.
 *
 * Rotation + reuse detection (enforced in authService/authController):
 *   - On login, the issued refresh token is added.
 *   - On refresh, the token is consumed (removed) and a new one added. If a
 *     token is presented that was already consumed (not in the store), the
 *     refresh is rejected and the *entire chain* for that user is invalidated
 *     (reuse detection → possible token theft).
 */

class InMemoryRefreshStore {
  constructor() {
    /** @type {Map<string, { userId: string, expiresAt: number }>} */
    this._tokens = new Map();
    /** userId -> Set<token> (for chain invalidation) */
    this._byUser = new Map();
  }

  _pruneExpired(token, entry) {
    if (entry && entry.expiresAt <= Date.now()) {
      this._delete(token, entry);
      return null;
    }
    return entry;
  }

  _delete(token, entry) {
    this._tokens.delete(token);
    if (entry) {
      const set = this._byUser.get(entry.userId);
      if (set) {
        set.delete(token);
        if (set.size === 0) this._byUser.delete(entry.userId);
      }
    }
  }

  async add(token, userId, ttlSeconds) {
    if (!token || !userId) throw new Error("token and userId are required");
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    const entry = { userId, expiresAt: Date.now() + ttl * 1000 };
    this._tokens.set(token, entry);
    if (!this._byUser.has(userId)) this._byUser.set(userId, new Set());
    this._byUser.get(userId).add(token);
  }

  async get(token) {
    const entry = this._tokens.get(token);
    return this._pruneExpired(token, entry);
  }

  async remove(token) {
    const entry = this._tokens.get(token);
    if (entry) this._delete(token, entry);
  }

  /** Invalidate every refresh token for a user (reuse detection). */
  async removeAllForUser(userId) {
    const set = this._byUser.get(userId);
    if (!set) return;
    for (const token of set) {
      this._tokens.delete(token);
    }
    this._byUser.delete(userId);
  }

  /** Test/dev helper. */
  clear() {
    this._tokens.clear();
    this._byUser.clear();
  }
}

module.exports = {
  InMemoryRefreshStore,
};
