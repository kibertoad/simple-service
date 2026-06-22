"use strict";

const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { ValidationError, NotFoundError, ConflictError } = require("./errors");

const scrypt = promisify(crypto.scrypt);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MIN = 1;
const NAME_MAX = 255;
const VALID_ROLES = new Set(["user", "admin"]);
const DEFAULT_ROLE = "user";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

const CREATE_REQUIRED_FIELDS = ["email", "name", "password"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function validateCreateInput(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return [{ field: "body", message: "Request body must be an object" }];
  }

  for (const field of CREATE_REQUIRED_FIELDS) {
    if (!(field in input) || input[field] === null || input[field] === undefined) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  return validateWritableFields(input);
}

function validateUpdateInput(input) {
  if (!input || typeof input !== "object") {
    return [{ field: "body", message: "Request body must be an object" }];
  }

  const allowed = ["email", "name", "password", "role"];
  const hasAny = allowed.some((field) => field in input);

  if (!hasAny) {
    return [{ field: "body", message: "At least one field must be provided" }];
  }

  return validateWritableFields(input);
}

function validateWritableFields(input) {
  const errors = [];

  if ("email" in input) {
    const email = normalizeEmail(input.email);
    if (!EMAIL_REGEX.test(email)) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
  }

  if ("name" in input) {
    if (typeof input.name !== "string") {
      errors.push({ field: "name", message: "name must be a string" });
    } else {
      const trimmed = input.name.trim();
      if (trimmed.length < NAME_MIN) {
        errors.push({ field: "name", message: "name is required" });
      } else if (trimmed.length > NAME_MAX) {
        errors.push({ field: "name", message: `name must be at most ${NAME_MAX} characters` });
      }
    }
  }

  if ("password" in input) {
    if (!isNonEmptyString(input.password)) {
      errors.push({ field: "password", message: "password must be a non-empty string" });
    } else if (input.password.length < 6) {
      errors.push({ field: "password", message: "password must be at least 6 characters" });
    }
  }

  if ("role" in input) {
    if (!VALID_ROLES.has(input.role)) {
      errors.push({ field: "role", message: `role must be one of: ${Array.from(VALID_ROLES).join(", ")}` });
    }
  }

  return errors;
}

function toDTO(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function parseListOptions(query) {
  const options = {
    limit: DEFAULT_LIST_LIMIT,
    offset: 0,
    q: null,
    role: null,
    sort: "createdAt_desc",
  };

  if (query) {
    const rawLimit = Number(query.limit);
    if (!Number.isNaN(rawLimit)) {
      options.limit = Math.min(Math.max(Math.floor(rawLimit), 1), MAX_LIST_LIMIT);
    }

    const rawOffset = Number(query.offset);
    if (!Number.isNaN(rawOffset)) {
      options.offset = Math.max(Math.floor(rawOffset), 0);
    }

    if (query.q !== undefined && query.q !== null && query.q !== "") {
      options.q = String(query.q).trim().toLowerCase();
    }

    if (query.role !== undefined && query.role !== null && query.role !== "") {
      options.role = String(query.role).trim();
    }

    if (query.sort === "createdAt_asc") {
      options.sort = "createdAt_asc";
    }
  }

  return options;
}

class UserService {
  constructor() {
    this.store = new Map();
  }

  async createUser(input) {
    const errors = validateCreateInput(input);
    if (errors.length > 0) {
      throw new ValidationError("Invalid user data", errors);
    }

    const email = normalizeEmail(input.email);
    const name = input.name.trim();
    const role = VALID_ROLES.has(input.role) ? input.role : DEFAULT_ROLE;

    const now = nowIso();
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      password: await hashPassword(input.password),
      role,
      createdAt: now,
      updatedAt: now,
    };

    this._insertUnique(user);

    return toDTO(user);
  }

  getUser(id) {
    this._assertValidId(id);
    const user = this.store.get(id);
    if (!user) {
      throw new NotFoundError(`User not found: ${id}`);
    }
    return toDTO(user);
  }

  listUsers(query) {
    const options = parseListOptions(query);
    let users = Array.from(this.store.values());

    if (options.role) {
      users = users.filter((user) => user.role === options.role);
    }

    if (options.q) {
      users = users.filter((user) => user.email.includes(options.q));
    }

    users.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return options.sort === "createdAt_asc" ? aTime - bTime : bTime - aTime;
    });

    const total = users.length;
    const data = users.slice(options.offset, options.offset + options.limit).map(toDTO);

    return {
      data,
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
      },
    };
  }

  async updateUser(id, input) {
    this._assertValidId(id);

    const errors = validateUpdateInput(input);
    if (errors.length > 0) {
      throw new ValidationError("Invalid user data", errors);
    }

    const existing = this.store.get(id);
    if (!existing) {
      throw new NotFoundError(`User not found: ${id}`);
    }

    let shouldCheckEmail = false;
    let newEmail = existing.email;

    if ("email" in input) {
      newEmail = normalizeEmail(input.email);
      if (newEmail !== existing.email) {
        shouldCheckEmail = true;
      }
    }

    const newName = "name" in input ? input.name.trim() : existing.name;
    const newRole = "role" in input ? input.role : existing.role;

    let newPassword = existing.password;
    if ("password" in input) {
      newPassword = await hashPassword(input.password);
    }

    const updated = {
      id: existing.id,
      email: newEmail,
      name: newName,
      password: newPassword,
      role: newRole,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    };

    if (shouldCheckEmail && this._emailInUse(newEmail, id)) {
      throw new ConflictError(`Email already in use: ${input.email}`);
    }

    this.store.set(id, updated);

    return toDTO(updated);
  }

  deleteUser(id) {
    this._assertValidId(id);

    if (!this.store.has(id)) {
      throw new NotFoundError(`User not found: ${id}`);
    }

    this.store.delete(id);
  }

  _insertUnique(user) {
    if (this._emailInUse(user.email)) {
      throw new ConflictError(`Email already in use: ${user.email}`);
    }
    this.store.set(user.id, user);
  }

  _emailInUse(email, excludeId) {
    for (const user of this.store.values()) {
      if (user.email === email && user.id !== excludeId) {
        return true;
      }
    }
    return false;
  }

  _assertValidId(id) {
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new NotFoundError(`User not found: ${id}`);
    }
  }
}

module.exports = {
  UserService,
  toDTO,
  validateCreateInput,
  validateUpdateInput,
};
