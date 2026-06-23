/**
 * In-memory organization repository with O(1) lookups by id and slug.
 * Data is scoped to the lifetime of the returned instance.
 *
 * @returns {{
 *   get: (id: string) => {id: string, name: string, slug: string} | undefined,
 *   getBySlug: (slug: string) => {id: string, name: string, slug: string} | undefined,
 *   has: (id: string) => boolean,
 *   insert: (org: {id: string, name: string, slug: string}) => void,
 *   replace: (org: {id: string, name: string, slug: string}) => void,
 * }}
 */
function createOrganizationStore() {
  const byId = new Map();
  const bySlug = new Map();

  return {
    get(id) {
      return byId.get(id);
    },

    getBySlug(slug) {
      const id = bySlug.get(slug);
      if (id === undefined) {
        return undefined;
      }
      return byId.get(id);
    },

    has(id) {
      return byId.has(id);
    },

    insert(org) {
      byId.set(org.id, org);
      bySlug.set(org.slug, org.id);
    },

    replace(org) {
      const existing = byId.get(org.id);
      if (existing !== undefined) {
        bySlug.delete(existing.slug);
      }
      byId.set(org.id, org);
      bySlug.set(org.slug, org.id);
    },
  };
}

module.exports = { createOrganizationStore };
