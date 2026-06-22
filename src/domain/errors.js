// Domain error types used by the service and mapped to HTTP responses in app.js.

class DomainError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }
}

class ValidationError extends DomainError {
  constructor(message = "Bad request") {
    super(message, "VALIDATION_ERROR", 400);
  }
}

class NotFoundError extends DomainError {
  constructor(message = "Not found") {
    super(message, "NOT_FOUND", 404);
  }
}

class ConflictError extends DomainError {
  constructor(message = "Conflict") {
    super(message, "CONFLICT", 409);
  }
}

module.exports = {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
};
