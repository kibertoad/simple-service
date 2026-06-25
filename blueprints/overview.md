# in-memory-resource-service

> Generated service blueprint. Read this overview first for the
> high-level structure; open `modules/<name>.md` only for a module
> directly relevant to your task.

A transient, in-memory REST service managing multiple resource collections (Users, Organizations, Bears, Office Tables, Buildings, Cars, Bicycles) with system-generated identifiers, per-resource domain validation, and no persistence across process restarts.

## Modules

### [user-management](modules/user-management.md)

Manages User resources: create and full-replace operations with system-generated UUID identifiers, name/email validation, and email uniqueness enforced in an in-memory store.

### [organization-management](modules/organization-management.md)

Manages Organization resources with system-generated UUID identifiers, name/slug validation, and slug uniqueness enforced in an in-memory store.

### [bear-crud](modules/bear-crud.md)

Manages Bear resources with full CRUD, UUIDv7 identifiers, name/age/colour validation, unique-name enforcement, and cursor-based pagination backed by in-memory storage.

### [office-table-management](modules/office-table-management.md)

Manages Office Table resources with full CRUD, UUIDv7 identifiers, non-negative price validation, fixed id/price/date-bought representation, full-replacement updates, direct JSON payloads, and cursor-based pagination over an in-memory store.

### [infrastructure](modules/infrastructure.md)

Technical infrastructure and cross-cutting concerns: Express application wiring, HTTP transport bootstrapping, global error handling, shared domain error types, and project build/deployment metadata.
