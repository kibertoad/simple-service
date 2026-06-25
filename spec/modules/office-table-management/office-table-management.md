# Office Table Management — Office Table Management

Capabilities for creating, retrieving, listing, updating, and deleting physical office furniture (office table) resources with UUIDv7 identifiers, non-negative price validation, fixed id/price/date-bought representation, full-replacement updates, direct JSON payloads, cursor-based pagination, and no API version prefixes.

## Requirements

- **Office Table CRUD endpoints** _(must, functional)_ — The system SHALL expose REST endpoints for Create, Read, Update, and Delete operations on office table resources; exact URL paths SHALL be determined at implementation time.
  - _Given_ the service is running _When_ its API is inspected _Then_ it exposes RESTful endpoints supporting all CRUD operations for office tables
- **Office Table representation** _(must, functional)_ — The system SHALL represent each office table resource with the fields id, price, and date bought, generating id as a UUIDv7 upon creation.
  - _Given_ a request to create an office table _When_ the resource is created _Then_ the system assigns a UUIDv7 identifier and stores the provided price and date bought
  - _Given_ any stored office table _When_ retrieved _Then_ its JSON representation contains id, price, and date bought
  - _Given_ a creation request that includes a client-supplied id _When_ the request is processed _Then_ the system ignores the supplied id and assigns its own UUIDv7 identifier
- **Office Table price validation** _(must, functional)_ — The system SHALL reject any create or update request that specifies a negative price.
  - _Given_ a request payload with a negative price _When_ the create endpoint processes the request _Then_ the system returns an HTTP status code consistent with common REST conventions indicating a client validation error and does not persist the invalid resource
  - _Given_ a request payload with a negative price for an existing office table _When_ the update endpoint processes the request _Then_ the system returns an HTTP status code consistent with common REST conventions indicating a client validation error and does not persist the invalid resource
  - _Given_ a request payload with a zero price _When_ the create or update endpoint processes the request _Then_ the operation succeeds because zero is a non-negative price
- **Retrieve Office Table endpoint** _(must, functional)_ — The system SHALL provide an endpoint to retrieve a single office table by its UUIDv7 identifier.
  - _Given_ an existing office table UUIDv7 identifier _When_ the retrieve endpoint is invoked _Then_ the system returns the resource directly as JSON with an HTTP status code consistent with common REST conventions for a successful retrieval
  - _Given_ a non-existent UUIDv7 identifier _When_ the retrieve endpoint is invoked _Then_ the system returns an HTTP status code consistent with common REST conventions indicating the resource was not found
- **List Office Tables endpoint** _(must, functional)_ — The system SHALL provide an endpoint to list office tables with cursor-based pagination.
  - _Given_ multiple office tables exist in the store _When_ the list endpoint is invoked _Then_ the system returns a paginated collection directly as JSON using cursor-based pagination
- **Office Table full replacement update** _(must, functional)_ — The system SHALL support only full resource replacement for updates.
  - _Given_ an existing office table _When_ an update request is received with a payload _Then_ the system replaces all stored fields with the payload contents and returns the updated resource
- **Direct JSON payloads** _(must, functional)_ — The system SHALL return resource and collection payloads directly as JSON without an envelope wrapper, using HTTP status codes consistent with common REST conventions.
  - _Given_ any successful CRUD operation for office tables _When_ the response is returned _Then_ the body contains the resource or collection directly without a data envelope
- **Office Table in-memory persistence** _(must, functional)_ — The system SHALL persist office table resources in a fully ephemeral in-memory store that is cleared on service restart.
  - _Given_ the service has stored office tables _When_ the service process restarts _Then_ no office table data from the previous process lifecycle remains
- **No API version prefixes** _(must, functional)_ — The system SHALL NOT include API version prefixes in endpoint URLs.
  - _Given_ any endpoint URL for office tables _When_ inspected _Then_ it does not contain a version path segment such as /v1/
- **Office Table REST interface conventions** _(must, nonfunctional)_ — The system SHALL expose a REST interface for office tables following common HTTP and REST conventions.
  - _Given_ a valid request to an office table endpoint using the HTTP method associated with the requested operation _When_ the request is processed _Then_ the response uses an HTTP status code consistent with common REST conventions for that operation
  - _Given_ a request to an office table endpoint using an HTTP method not supported by that endpoint _When_ the request is processed _Then_ the response uses an HTTP status code consistent with common REST conventions indicating the method is not allowed
  - _Given_ an invalid request payload for an office table create or update operation _When_ the request is processed _Then_ the response uses an HTTP status code consistent with common REST conventions indicating a client validation error
- **Office Table in-memory response times** _(must, nonfunctional)_ — The system SHALL use an in-memory store with response times characteristic of in-memory data access for all Office Table CRUD operations.
  - _Given_ the in-memory store contains office table data _When_ any CRUD operation is performed _Then_ the operation completes without disk I/O or durable storage access
  - _Given_ the service is processing office table requests _When_ response times are observed _Then_ CRUD operations complete within a timeframe characteristic of in-memory data access

## Domain rules

- **An Office Table id is an immutable UUIDv7 generated by the system at resource creation; client-provided ids are not accepted.**
  - _Why:_ Provides time-ordered, globally unique identifiers while preventing identity spoofing.
- **An Office Table price must be non-negative for every persisted resource.**
  - _Why:_ Prevents invalid financial values for furniture records.
- **An Office Table entity has exactly the fields id, price, and date bought.**
  - _Why:_ Keeps the furniture resource model minimal and predictable for clients.
- **Replacement of an Office Table is a full replacement of all stored fields; partial updates via PATCH are prohibited.**
  - _Why:_ Avoids partial-update ambiguity and keeps the state transfer contract explicit.
- **Office Table data persists only in memory for the lifetime of the process.**
  - _Why:_ Matches the explicit fully ephemeral in-memory store requirement.
- **Office Table endpoint URLs SHALL NOT contain API version path segments.**
  - _Why:_ The product owner specified no API version prefixes.
- **An office table is a physical furniture item; the data model and business logic apply to furniture, not database tables or abstract entities.**
  - _Why:_ Clarifies the domain scope so that the resource is interpreted as office furniture rather than database tables or other abstract constructs.
