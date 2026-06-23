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
- **A Bear id is immutable and is system-assigned as a UUIDv7 value at creation time; clients cannot supply or modify it.**
  - _Why:_ Guarantees unique, ordered identity without client coordination and prevents identity spoofing or alteration.
- **A Bear name acts as a unique key across the entire bear collection.**
  - _Why:_ Prevents duplicate bear records and ambiguous identification.
- **A Bear age is strictly a non-negative integer; fractional or negative values are prohibited.**
  - _Why:_ Ensures age is stored as a valid whole number that represents a meaningful duration.
- **A Bear name must be non-empty, must not exceed 100 characters, and is subject to additional applicable character/pattern restrictions.**
  - _Why:_ Maintains data quality and consistent naming constraints.
- **A Bear colour is freeform text with no predefined enumeration, format, or length constraint.**
  - _Why:_ Allows clients to capture colour values flexibly without constraining the domain model.
- **Bear updates use full replacement semantics, meaning the request representation entirely supersedes the previous mutable state of the resource.**
  - _Why:_ Avoids partial-update ambiguity and keeps the state transfer contract explicit.
- **Bear data persists only in memory for the lifetime of the process; no durable storage or cross-process replication is provided.**
  - _Why:_ Matches the explicit in-memory store requirement and sets clear durability expectations.
