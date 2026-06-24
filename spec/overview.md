# user-service — Requirements

> Generated, prescriptive requirements for this service (what MUST be
> true). Read this first. `rules.md` lists cross-cutting invariants;
> `features/*.feature` are the acceptance scenarios your work must satisfy.

A simple in-memory user management service exposing REST endpoints to create users and fully replace existing user records, with system-generated UUID identifiers and unique email addresses.

## User Management

Capabilities for creating and fully replacing User resources with a fixed id/name/email schema, UUID generation, and email uniqueness enforced in an in-memory store.

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

## Bear CRUD

Capabilities for creating, reading, listing, updating, and deleting Bear resources with id/name/age/colour schema, UUIDv7 generation, validation rules for name and age, freeform colour, and cursor-based pagination backed by in-memory storage.

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
