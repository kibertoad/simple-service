"use strict";

const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * TokenService — sign/verify access + refresh JWTs.
 *
 * Access tokens carry { sub, email, roles } and are short-lived. Refresh
 * tokens carry { sub, jti } and are longer-lived; their revocation is handled
 * by RefreshStore (allowlist), not by JWT expiry alone.
 */
class TokenService {
  /**
   * @param {{ accessSecret, refreshSecret, accessTtl, refreshTtl, clockTolerance }} jwtConfig
   */
  constructor(jwtConfig = config.jwt) {
    this.accessSecret = jwtConfig.accessSecret;
    this.refreshSecret = jwtConfig.refreshSecret;
    this.accessTtl = jwtConfig.accessTtl;
    this.refreshTtl = jwtConfig.refreshTtl;
    this.clockTolerance = jwtConfig.clockTolerance || 0;
  }

  /**
   * Sign an access token.
   * @param {{ id: string, email: string, roles: string[] }} user
   * @returns {string}
   */
  signAccess(user) {
    if (!user || !user.id) throw new Error("user.id is required");
    return jwt.sign(
      { sub: user.id, email: user.email, roles: user.roles || [] },
      this.accessSecret,
      { expiresIn: this.accessTtl }
    );
  }

  /**
   * Sign a refresh token. Includes a jti so the RefreshStore can track it.
   * @param {{ id: string }} user
   * @returns {string}
   */
  signRefresh(user) {
    if (!user || !user.id) throw new Error("user.id is required");
    return jwt.sign(
      { sub: user.id, jti: _randomJti() },
      this.refreshSecret,
      { expiresIn: this.refreshTtl }
    );
  }

  /**
   * Verify an access token. Returns the payload or null.
   * @returns {{ sub: string, email: string, roles: string[] } | null}
   */
  verify(token) {
    try {
      return jwt.verify(token, this.accessSecret, {
        clockTolerance: this.clockTolerance,
      });
    } catch {
      return null;
    }
  }

  /**
   * Verify a refresh token. Returns the payload or null.
   * @returns {{ sub: string, jti: string } | null}
   */
  verifyRefresh(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        clockTolerance: this.clockTolerance,
      });
    } catch {
      return null;
    }
  }

  /** Convert a human-readable ttl like "7d" to whole seconds. */
  ttlSeconds(ttl = this.refreshTtl) {
    return Math.floor(_ttlToSeconds(ttl));
  }
}

function _randomJti() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "jti_" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function _ttlToSeconds(ttl) {
  if (typeof ttl === "number") return ttl;
  const m = /^(\d+)\s*([smhd])$/.exec(String(ttl).trim());
  if (!m) {
    // Fall back to treating as seconds.
    const n = parseInt(ttl, 10);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return n * mult;
}

module.exports = { TokenService };
