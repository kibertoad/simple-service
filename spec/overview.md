# in-memory-resource-service — Specification

> Prescriptive spec for this service (what MUST be true). This index lists the
> modules and their features; open `modules/<module>/<feature>.md` for detail
> and `features/<module>/*.feature` for the acceptance scenarios to satisfy.

A transient, in-memory REST service managing multiple resource collections: Users, Organizations, Buildings, Cars, Bicycles, and Office Tables. Each resource type supports create/get/list/update/delete operations, uses system-generated identifiers, enforces simple per-resource domain validation, and persists only for the lifetime of the process.

## Bear CRUD

Capabilities for creating, reading, listing, updating, and deleting Bear resources with id/name/age/colour schema, UUIDv7 generation, validation rules for name and age, freeform colour, and cursor-based pagination backed by in-memory storage.

- [Bear CRUD](modules/bear-crud/bear-crud.md) — Capabilities for creating, reading, listing, updating, and deleting Bear resources with id/name/age/colour schema, UUIDv7 generation, validation rules for name and age, freeform colour, and cursor-based pagination backed by in-memory storage.

## Bicycle Management

Capabilities for typical CRUD operations on Bicycle resources using a transient in-memory store.

- [Bicycle Management](modules/bicycle-management/bicycle-management.md) — Capabilities for typical CRUD operations on Bicycle resources using a transient in-memory store.

## Building Management

Capabilities for creating, retrieving, updating, deleting, and listing Building resources with unique identifiers, name and address fields, and cursor-based pagination over a transient in-memory store.

- [Building Management](modules/building-management/building-management.md) — Capabilities for creating, retrieving, updating, deleting, and listing Building resources with unique identifiers, name and address fields, and cursor-based pagination over a transient in-memory store.

## Car Management

Capabilities for typical CRUD operations on Car resources using a transient in-memory store.

- [Car Management](modules/car-management/car-management.md) — Capabilities for typical CRUD operations on Car resources using a transient in-memory store.

## GitHub Actions

Capabilities for repository automation and security scanning workflows using GitHub Actions.

- [Security Scanning](modules/github-actions/security-scanning.md) — Static security analysis of GitHub Actions workflow definitions using zizmor, surfaced via SARIF without blocking CI.

## Office Table Management

Capabilities for creating, retrieving, listing, updating, and deleting physical office furniture (office table) resources with UUIDv7 identifiers, non-negative price validation, fixed id/price/date-bought representation, full-replacement updates, direct JSON payloads, cursor-based pagination, and no API version prefixes.

- [Office Table Management](modules/office-table-management/office-table-management.md) — Capabilities for creating, retrieving, listing, updating, and deleting physical office furniture (office table) resources with UUIDv7 identifiers, non-negative price validation, fixed id/price/date-bought representation, full-replacement updates, direct JSON payloads, cursor-based pagination, and no API version prefixes.

## Organization Management

Capabilities for creating and fully replacing Organization resources with a fixed id/name/slug schema, UUID generation, and slug uniqueness enforced in an in-memory store.

- [Organization Management](modules/organization-management/organization-management.md) — Capabilities for creating and fully replacing Organization resources with a fixed id/name/slug schema, UUID generation, and slug uniqueness enforced in an in-memory store.

## User Management

Capabilities for creating and fully replacing User resources with a fixed id/name/email schema, UUID generation, and email uniqueness enforced in an in-memory store.

- [User Management](modules/user-management/user-management.md) — Capabilities for creating and fully replacing User resources with a fixed id/name/email schema, UUID generation, and email uniqueness enforced in an in-memory store.
