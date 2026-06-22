"use strict";

class ValidationError extends Error {
  constructor(message, details) {
    super(message || "Validation failed");
    this.name = "ValidationError";
    this.details = details || [];
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message || "Not found");
    this.name = "NotFoundError";
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message || "Conflict");
    this.name = "ConflictError";
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  ConflictError,
};
