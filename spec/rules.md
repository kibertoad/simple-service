# user-order-service — Domain rules

> Cross-cutting invariants and constraints this service must never violate.

- **A User id is immutable and is system-assigned as a UUID at creation time.**
  - _Why:_ Guarantees unique identity without requiring client coordination and prevents identity spoofing or alteration.
- **The email address acts as a unique key across the entire user population.**
  - _Why:_ Prevents duplicate accounts and ambiguous identity lookups.
- **Replacement of a User is a full-record operation requiring id, name, and email; partial updates are not permitted.**
  - _Why:_ Avoids partial-update ambiguity and keeps the state transfer contract explicit.
- **A User entity has exactly the fields id, name, and email.**
  - _Why:_ Keeps the domain model minimal and predictable for clients.
- **User data persists only in memory for the lifetime of the process; no durable storage or cross-process replication is provided.**
  - _Why:_ Matches the explicit in-memory store requirement and sets clear durability expectations.
- **An Order id is immutable and is system-assigned as a UUID at creation time.**
  - _Why:_ Guarantees unique identity without requiring clients to manage identifier allocation.
- **The status field of an Order is restricted to the values "active", "cancelled", or "completed".**
  - _Why:_ Enforces the validated business vocabulary agreed upon for Order status.
- **An Order entity has exactly the fields id, status, and timestamp.**
  - _Why:_ Establishes the minimal, agreed-upon schema for the entity.
- **Order data persists only in memory for the lifetime of the process; no durable storage or cross-process replication is provided.**
  - _Why:_ Matches the explicit in-memory store requirement and sets clear durability expectations.
- **All read and write operations against the shared in-memory store are thread-safe.**
  - _Why:_ Parallel HTTP requests may access the store simultaneously, and race conditions must be prevented.
