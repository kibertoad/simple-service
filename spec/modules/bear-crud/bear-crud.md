# Bear CRUD — Bear CRUD

Capabilities for creating, reading, listing, updating, and deleting Bear resources with id/name/age/colour schema, UUIDv7 generation, validation rules for name and age, freeform colour, and cursor-based pagination backed by in-memory storage.

## Requirements

- **Create Bear** _(must, functional)_ — The system SHALL create a bear record from a client-provided name, age, and colour, assigning a service-generated UUIDv7 identifier and returning the complete record.
  - _Given_ a non-empty, unique name no longer than 100 characters that also satisfies applicable character/pattern restrictions, a non-negative integer age, and a freeform colour _When_ a create request is submitted _Then_ the system stores the bear and returns the record including the generated UUIDv7 identifier
  - _Given_ a create request with an empty name _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a name that exceeds 100 characters _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a name that duplicates an existing bear name _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a name that violates applicable character/pattern restrictions _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a negative age _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with an age that is not an integer _When_ the request is submitted _Then_ the system rejects the request
- **Read Bear** _(must, functional)_ — The system SHALL retrieve a single bear by its UUIDv7 identifier.
  - _Given_ a bear exists with a known UUIDv7 identifier _When_ a read request is made for that identifier _Then_ the system returns the corresponding bear record
  - _Given_ a read request for a UUIDv7 identifier that does not exist _When_ the request is made _Then_ the system indicates that the bear was not found
- **List Bears** _(must, functional)_ — The system SHALL list all stored bears using cursor-based pagination.
  - _Given_ one or more bears exist in storage _When_ a list request is made _Then_ the system returns a paginated result set using cursor-based pagination
  - _Given_ no bears exist _When_ a list request is made _Then_ the system returns an empty paginated result set
- **Update Bear** _(must, functional)_ — The system SHALL update an existing bear, identified by UUIDv7, by fully replacing its mutable fields (name, age, colour).
  - _Given_ an existing bear and a replacement representation that satisfies all creation validation rules _When_ an update request is submitted _Then_ the system overwrites the bear's mutable fields and returns the updated record
  - _Given_ an update request with an invalid age _When_ the request is submitted _Then_ the system rejects the update
  - _Given_ an update request with a duplicate name _When_ the request is submitted _Then_ the system rejects the update
  - _Given_ an update request with an empty name _When_ the request is submitted _Then_ the system rejects the update
  - _Given_ an update request that omits one or more mutable fields _When_ the request is submitted _Then_ the system applies full replacement semantics and stores exactly the provided values
- **Delete Bear** _(must, functional)_ — The system SHALL delete a bear by its UUIDv7 identifier.
  - _Given_ an existing bear _When_ a delete request is made by identifier _Then_ the system removes the bear from storage
  - _Given_ a delete request for a UUIDv7 identifier that does not exist _When_ the request is made _Then_ the system indicates that the bear was not found
- **Bear in-memory persistence** _(must, functional)_ — The system SHALL retain all bear records in volatile, in-memory storage with no persistence across process restarts.
  - _Given_ bears have been created in the service _When_ the service process restarts _Then_ no bear records remain
- **In-memory operation latency** _(should, functional)_ — The system SHALL process all CRUD operations with latency consistent with in-memory data access and without reliance on external persistence services.
  - _Given_ bear CRUD operations are executed _When_ the system processes them _Then_ responses are produced without reliance on external persistence services and with latency consistent with in-memory access
- **Local UUIDv7 generation** _(should, functional)_ — The system SHALL generate UUIDv7 identifiers using only local runtime capabilities.
  - _Given_ the service generates a bear identifier _When_ identifier generation occurs _Then_ the identifier is produced using only local runtime capabilities without depending on external network services

## Domain rules

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
