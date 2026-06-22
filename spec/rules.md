# user-service — Domain rules

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
