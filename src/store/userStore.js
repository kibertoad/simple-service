/**
 * In-memory user repository with O(1) lookups by id and email.
 * Data is scoped to the lifetime of the returned instance.
 *
 * @returns {{
 *   get: (id: string) => {id: string, name: string, email: string} | undefined,
 *   getByEmail: (email: string) => {id: string, name: string, email: string} | undefined,
 *   has: (id: string) => boolean,
 *   insert: (user: {id: string, name: string, email: string}) => void,
 *   replace: (user: {id: string, name: string, email: string}) => void,
 * }}
 */
function createUserStore() {
  const byId = new Map();
  const byEmail = new Map();

  return {
    get(id) {
      return byId.get(id);
    },

    getByEmail(email) {
      const id = byEmail.get(email);
      if (id === undefined) {
        return undefined;
      }
      return byId.get(id);
    },

    has(id) {
      return byId.has(id);
    },

    insert(user) {
      byId.set(user.id, user);
      byEmail.set(user.email, user.id);
    },

    replace(user) {
      const existing = byId.get(user.id);
      if (existing !== undefined) {
        byEmail.delete(existing.email);
      }
      byId.set(user.id, user);
      byEmail.set(user.email, user.id);
    },
  };
}

module.exports = { createUserStore };
