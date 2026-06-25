# User Management — User Management

Capabilities for creating and fully replacing User resources with a fixed id/name/email schema, UUID generation, and email uniqueness enforced in an in-memory store.

## Requirements

- **Create User endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that creates a User from a supplied name and email.
  - _Given_ a creation request containing valid values for name and email _When_ the request is processed _Then_ a new User is persisted with a system-generated UUID as its id, and a success response is returned
  - _Given_ a creation request that does not include a name _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that does not include an email _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that includes an email already held by a persisted User _When_ the request is processed _Then_ the system rejects the request to preserve email uniqueness
  - _Given_ a creation request that includes extra fields beyond name and email _When_ the request is processed _Then_ the persisted User contains only id, name, and email; any additional fields are discarded
- **Replace User endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that fully replaces an existing persisted User with a complete User record.
  - _Given_ an existing User and a replace request containing a complete User record including id, name, and email _When_ the request is processed _Then_ the stored User is fully replaced with the supplied record, and a success response is returned
  - _Given_ a replace request referencing an id that does not identify any persisted User _When_ the request is processed _Then_ the system rejects the request because the target User does not exist
  - _Given_ a replace request for an existing User where the request body is missing name, email, or id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request where the id in the request body does not match the targeted User's id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request for an existing User that repeats the User's own current email _When_ the request is processed _Then_ the replacement succeeds and the User remains uniquely represented
  - _Given_ a replace request for an existing User that specifies an email already held by a different User _When_ the request is processed _Then_ the system rejects the request to preserve email uniqueness
  - _Given_ a replace request for an existing User that includes extra fields beyond id, name, and email _When_ the request is processed _Then_ the persisted User contains only id, name, and email; any additional fields are discarded
- **UUID identifier generation** _(must, functional)_ — The system SHALL generate a UUID for the User id upon creation and SHALL NOT allow clients to supply or modify it.
  - _Given_ a User creation request _When_ the system persists the User _Then_ the id value is a valid, system-generated UUID
  - _Given_ two independent User creation requests _When_ both Users are persisted _Then_ each User is assigned a distinct id
  - _Given_ a creation request that includes a client-supplied id _When_ the request is processed _Then_ the system ignores the supplied id and assigns its own UUID
  - _Given_ an existing User _When_ a replace request is processed _Then_ the User's id remains unchanged from the value assigned at creation
- **Email uniqueness** _(must, functional)_ — The system SHALL enforce that the email field is unique across all persisted Users for both creation and replacement operations.
  - _Given_ a User already exists with a specific email address _When_ a creation request specifies that same email _Then_ the system rejects the request
  - _Given_ a User already exists with a specific email address _When_ a replace request for a different User specifies that same email _Then_ the system rejects the request
  - _Given_ a User already exists with a specific email address _When_ a replace request for that same User repeats the current email _Then_ the replacement succeeds and uniqueness is maintained
  - _Given_ no persisted User has a specific email address _When_ a creation or replace request specifies that email _Then_ the operation succeeds and the new email is stored
- **User representation** _(must, functional)_ — The system SHALL represent a User with exactly the fields id, name, and email, and SHALL NOT persist additional fields supplied by clients.
  - _Given_ any persisted User _When_ the record is inspected _Then_ it contains exactly the fields id, name, and email
  - _Given_ a User has been created or replaced _When_ the persisted record is retrieved _Then_ no extra computed or metadata fields are present beyond id, name, and email
- **In-memory persistence** _(must, functional)_ — The system SHALL use an in-memory store for all User persistence.
  - _Given_ a User has been persisted _When_ the running process serves subsequent requests _Then_ the User record remains available and can be replaced within the same process instance
  - _Given_ a User has been persisted _When_ the process is restarted _Then_ the previously persisted User records are no longer present

## Domain rules

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
