# user-order-service — Requirements

> Generated, prescriptive requirements for this service (what MUST be
> true). Read this first. `rules.md` lists cross-cutting invariants;
> `features/*.feature` are the acceptance scenarios your work must satisfy.

An in-memory REST service that manages Users (create and full replace) and Orders (create, read, list, delete). Users receive system-generated UUID identifiers and must have unique email addresses. Orders receive system-generated UUID identifiers, carry a restricted status vocabulary, and are accessed through thread-safe, ephemeral in-memory persistence.

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
  - _Given_ a replace request referencing an id that does not identify any persisted User _When_ the request is processed _Then_ the system indicates that the target User was not found and makes no modification
  - _Given_ a replace request for an existing User where the request body is missing name, email, or id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request where the id in the request body does not match the targeted User's id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request for an existing User that repeats the User's own current email _When_ the request is processed _Then_ the replacement succeeds and the User remains uniquely represented
  - _Given_ a replace request for an existing User that specifies an email already held by a different User _When_ the request is processed _Then_ the system rejects the request to preserve email uniqueness
  - _Given_ a replace request for an existing User that includes extra fields beyond id, name, and email _When_ the request is processed _Then_ the persisted User contains only id, name, and email; any additional fields are discarded
- **UUID identifier generation for Users** _(must, functional)_ — The system SHALL generate a UUID for the User id upon creation and SHALL NOT allow clients to supply or modify it.
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
- **User in-memory persistence** _(must, nonfunctional)_ — The system SHALL persist User data solely in memory for the lifetime of the service process.
  - _Given_ a User has been persisted _When_ the running process serves subsequent requests _Then_ the User record remains available and can be replaced within the same process instance
  - _Given_ a User has been persisted _When_ the process is restarted _Then_ the previously persisted User records are no longer present

## Order Management

Capabilities for creating, reading, listing, and deleting Order resources with a fixed id/status/timestamp schema, system-generated UUID identifiers, a restricted status vocabulary, and thread-safe in-memory persistence.

- **Create Order endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that creates an Order from a client-provided status and timestamp, assigning a server-generated UUID as the id.
  - _Given_ a status value of "active", "cancelled", or "completed" and a provided timestamp _When_ a create request is submitted _Then_ the system stores an Order with a generated UUID, the given status, and the given timestamp, and returns a success response
  - _Given_ a status value outside the allowed set _When_ a create request is submitted _Then_ the system rejects the request and does not create an Order
  - _Given_ a create request that is missing a status _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a create request that is missing a timestamp _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a create request that includes extra fields beyond status and timestamp _When_ the request is processed _Then_ the persisted Order contains only id, status, and timestamp; any additional fields are discarded
- **Read Order endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that retrieves an existing Order by its UUID.
  - _Given_ an Order exists with a specific UUID _When_ a read request is submitted for that UUID _Then_ the system returns the Order's id, status, and timestamp
  - _Given_ no Order exists for the requested UUID _When_ a read request is submitted _Then_ the system indicates that the Order was not found
  - _Given_ a read request with a value that is not a UUID _When_ the request is processed _Then_ the system indicates that the Order was not found
- **List Orders endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that returns a list of all stored Orders.
  - _Given_ one or more Orders exist in the store _When_ a list request is submitted _Then_ the system returns a collection containing every Order
  - _Given_ no Orders exist in the store _When_ a list request is submitted _Then_ the system returns an empty collection
- **Delete Order endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that deletes an Order by its UUID.
  - _Given_ an Order exists with a specific UUID _When_ a delete request is submitted for that UUID _Then_ the system removes the Order from the store and returns a success response
  - _Given_ no Order exists for the requested UUID _When_ a delete request is submitted _Then_ the system completes the request without modifying the store
  - _Given_ a delete request with a value that is not a UUID _When_ the request is processed _Then_ the system completes the request without modifying the store
- **UUID identifier generation for Orders** _(must, functional)_ — The system SHALL generate a UUID for the Order id upon creation and SHALL NOT allow clients to supply or modify it.
  - _Given_ an Order creation request _When_ the system persists the Order _Then_ the id value is a valid, system-generated UUID
  - _Given_ two independent Order creation requests _When_ both Orders are persisted _Then_ each Order is assigned a distinct id
  - _Given_ a creation request that includes a client-supplied id _When_ the request is processed _Then_ the system ignores the supplied id and assigns its own UUID
- **Order status validation** _(must, functional)_ — The system SHALL restrict the Order status field to exactly the values "active", "cancelled", or "completed".
  - _Given_ a create request with status "active" _When_ the request is processed _Then_ the Order is created
  - _Given_ a create request with status "cancelled" _When_ the request is processed _Then_ the Order is created
  - _Given_ a create request with status "completed" _When_ the request is processed _Then_ the Order is created
  - _Given_ a create request with a status value that is not exactly "active", "cancelled", or "completed" (for example "pending" or case variants such as "Active") _When_ the request is processed _Then_ the system rejects the request and does not create an Order
- **Order representation** _(must, functional)_ — The system SHALL represent an Order with exactly the fields id, status, and timestamp, and SHALL NOT persist additional fields supplied by clients.
  - _Given_ any persisted Order _When_ the record is inspected _Then_ it contains exactly the fields id, status, and timestamp
  - _Given_ an Order has been created _When_ the persisted record is retrieved _Then_ no extra computed or metadata fields are present beyond id, status, and timestamp
- **Order in-memory persistence** _(must, nonfunctional)_ — The system SHALL persist Order data solely in memory for the lifetime of the service process.
  - _Given_ an Order has been persisted _When_ the running process serves subsequent read, list, and delete requests _Then_ the Order record remains available within the same process instance
  - _Given_ an Order has been persisted _When_ the process is restarted _Then_ the previously persisted Order records are no longer present
- **Thread-safe store access** _(must, nonfunctional)_ — The system SHALL ensure thread-safe concurrent access to the in-memory store for Order read and write operations.
  - _Given_ multiple concurrent create requests for Orders _When_ all requests are processed _Then_ each Order is stored exactly once with a unique id and without data corruption
  - _Given_ concurrent read or list requests while Orders are being created or deleted _When_ all requests are processed _Then_ the responses are internally consistent and do not observe torn or partially updated records
  - _Given_ concurrent delete requests for the same Order UUID _When_ all requests are processed _Then_ the Order is removed from the store and the store remains consistent
