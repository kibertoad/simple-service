# User CRUD Service — Domain rules

> Cross-cutting invariants and constraints this service must never violate.

- **The user data structure SHALL include `id`, `name`, and `email`**
  - _Why:_ Defined by the product owner to ensure consistency
- **The email field SHALL adhere to a valid email format**
  - _Why:_ To ensure data integrity and usability
- **The system operates in a trusted environment**
  - _Why:_ No authentication is required
- **User identification is solely based on `id`**
  - _Why:_ As specified by the product owner
