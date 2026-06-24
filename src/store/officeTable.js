/**
 * In-memory office table repository with cursor-based pagination.
 * Data is scoped to the lifetime of the returned instance.
 *
 * @returns {{
 *   get: (id: string) => {id: string, price: number, dateBought: string} | undefined,
 *   has: (id: string) => boolean,
 *   insert: (table: {id: string, price: number, dateBought: string}) => void,
 *   replace: (table: {id: string, price: number, dateBought: string}) => void,
 *   delete: (id: string) => boolean,
 *   list: (params: {afterId?: string, limit?: number}) => {items: Array<{id: string, price: number, dateBought: string}>, nextCursor?: string},
 * }}
 */
function createOfficeTableStore() {
  const byId = new Map();

  function get(id) {
    return byId.get(id);
  }

  function has(id) {
    return byId.has(id);
  }

  function insert(table) {
    byId.set(table.id, table);
  }

  function replace(table) {
    byId.set(table.id, table);
  }

  function deleteTable(id) {
    return byId.delete(id);
  }

  function list({ afterId, limit = 20 } = {}) {
    const all = Array.from(byId.values());
    const sorted = all.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const start = afterId ? sorted.findIndex((t) => t.id > afterId) : 0;
    const page = sorted.slice(
      start < 0 ? sorted.length : start,
      (start < 0 ? sorted.length : start) + limit
    );

    const hasMore = start < sorted.length && start + limit < sorted.length;
    const result = { items: page };
    if (hasMore) {
      const lastId = page[page.length - 1].id;
      result.nextCursor = encodeCursor({ id: lastId });
    }

    return result;
  }

  return {
    get,
    has,
    insert,
    replace,
    delete: deleteTable,
    list,
  };
}

function encodeCursor({ id }) {
  return Buffer.from(JSON.stringify({ id }), "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  const json = Buffer.from(cursor, "base64url").toString("utf8");
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed.id !== "string") {
    throw new Error("Invalid cursor");
  }
  return parsed;
}

module.exports = { createOfficeTableStore, decodeCursor };
