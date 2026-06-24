function encodeCursor(bear) {
  return Buffer.from(JSON.stringify({ id: bear.id })).toString("base64url");
}

function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed.id !== "string") {
      return null;
    }
    return parsed.id;
  } catch {
    return null;
  }
}

/**
 * In-memory bear repository with O(1) lookups by id and name.
 * Data is scoped to the lifetime of the returned instance.
 *
 * @returns {{
 *   get: (id: string) => {id: string, name: string, age: number, colour: string} | undefined,
 *   getByName: (name: string) => {id: string, name: string, age: number, colour: string} | undefined,
 *   has: (id: string) => boolean,
 *   insert: (bear: {id: string, name: string, age: number, colour: string}) => void,
 *   replace: (bear: {id: string, name: string, age: number, colour: string}) => void,
 *   delete: (id: string) => void,
 *   list: (opts: {cursor?: string, limit?: number}) => {data: Bear[], nextCursor: string | null},
 * }}
 */
function createBearStore() {
  const byId = new Map();
  const byName = new Map();

  return {
    get(id) {
      return byId.get(id);
    },

    getByName(name) {
      const id = byName.get(name);
      if (id === undefined) {
        return undefined;
      }
      return byId.get(id);
    },

    has(id) {
      return byId.has(id);
    },

    insert(bear) {
      byId.set(bear.id, bear);
      byName.set(bear.name, bear.id);
    },

    replace(bear) {
      const existing = byId.get(bear.id);
      if (existing !== undefined && existing.name !== bear.name) {
        byName.delete(existing.name);
      }
      byId.set(bear.id, bear);
      byName.set(bear.name, bear.id);
    },

    delete(id) {
      const existing = byId.get(id);
      if (existing !== undefined) {
        byName.delete(existing.name);
        byId.delete(id);
      }
    },

    list({ cursor, limit = 50 } = {}) {
      let startId = "";
      if (cursor !== undefined && cursor !== "") {
        startId = decodeCursor(cursor) ?? "invalid";
      }

      const all = Array.from(byId.values());
      const page = all
        .filter((bear) => bear.id > startId)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .slice(0, limit);

      const nextCursor = page.length === limit ? encodeCursor(page[page.length - 1]) : null;
      return { data: page, nextCursor };
    },

    // Exposed for unit testing pagination cursors without reaching into internals.
    _encodeCursor: encodeCursor,
    _decodeCursor: decodeCursor,
  };
}

module.exports = { createBearStore };
