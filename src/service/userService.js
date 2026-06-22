const { randomUUID } = require("node:crypto");
const { buildUser, assertCreatableInput, assertReplaceableInput } = require("../domain/user");
const { ValidationError, ConflictError, NotFoundError } = require("../domain/errors");

/**
 * Create the user service.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../store/userStore").createUserStore>} deps.store
 * @param {() => string} [deps.generateId]
 */
function createUserService({ store, generateId = randomUUID }) {
  function createUser(input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { name, email } = input;
    assertCreatableInput({ name, email });

    if (store.getByEmail(email)) {
      throw new ConflictError("Email already in use");
    }

    const user = buildUser({ id: generateId(), name, email });
    store.insert(user);
    return user;
  }

  function replaceUser(pathId, input) {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const { id: bodyId, name, email } = input;
    assertReplaceableInput({ id: bodyId, name, email });

    if (bodyId !== pathId) {
      throw new ValidationError("id in body does not match path id");
    }

    if (!store.has(pathId)) {
      throw new NotFoundError("User not found");
    }

    const existingWithEmail = store.getByEmail(email);
    if (existingWithEmail && existingWithEmail.id !== pathId) {
      throw new ConflictError("Email already in use");
    }

    const user = buildUser({ id: pathId, name, email });
    store.replace(user);
    return user;
  }

  return { createUser, replaceUser };
}

module.exports = { createUserService };
