# User Management Service — Domain rules

> Cross-cutting invariants and constraints this service must never violate.

- **All user data must be stored in temporary in-memory storage**
  - _Why:_ Implementation requirement for transient data storage
- **User IDs must be unique across all users**
  - _Why:_ Ensures data integrity and proper identification
- **Validation must be performed on all user input data**
  - _Why:_ Prevents invalid or malformed data from being stored
