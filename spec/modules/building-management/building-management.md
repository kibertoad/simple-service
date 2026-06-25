# Building Management — Building Management

Capabilities for creating, retrieving, updating, deleting, and listing Building resources with unique identifiers, name and address fields, and cursor-based pagination over a transient in-memory store.

## Requirements

- **Create Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to create an office building from a name and an address.
  - _Given_ a creation request containing a name not exceeding 80 characters and an address not exceeding 160 characters _When_ the request is processed _Then_ the system stores the Building with a unique identifier and returns the Building record
  - _Given_ a creation request containing a name exceeding 80 characters _When_ the request is processed _Then_ the system performs basic error handling and does not create the Building
  - _Given_ a creation request containing an address exceeding 160 characters _When_ the request is processed _Then_ the system performs basic error handling and does not create the Building
  - _Given_ a creation request containing a missing name or address _When_ the request is processed _Then_ the system performs basic error handling and does not create the Building
- **Retrieve Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to retrieve an office building by its unique identifier.
  - _Given_ a Building exists for the provided identifier _When_ the request is processed _Then_ the system returns the Building record
  - _Given_ no Building exists for the provided identifier _When_ the request is processed _Then_ the system performs basic error handling
- **Update Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to update an existing office building.
  - _Given_ a stored Building and a request containing a name not exceeding 80 characters and an address not exceeding 160 characters _When_ the request is processed _Then_ the system modifies the record and returns the updated Building
  - _Given_ no Building exists for the provided identifier _When_ an update request is processed _Then_ the system performs basic error handling
  - _Given_ an update request containing a name exceeding 80 characters _When_ the request is processed _Then_ the system performs basic error handling and does not modify the Building
  - _Given_ an update request containing an address exceeding 160 characters _When_ the request is processed _Then_ the system performs basic error handling and does not modify the Building
- **Delete Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to permanently delete an office building by its unique identifier.
  - _Given_ a stored Building _When_ a delete request is processed _Then_ the system permanently removes the record from the in-memory store
  - _Given_ no Building exists for the provided identifier _When_ a delete request is processed _Then_ the system performs basic error handling
- **List Buildings endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to list office buildings with cursor-based pagination.
  - _Given_ zero stored buildings _When_ the list endpoint is invoked _Then_ the system returns a paginated collection with no items
  - _Given_ fewer buildings than the page size _When_ the list endpoint is invoked _Then_ the system returns all buildings and a pagination response indicating no next cursor
  - _Given_ more buildings than the page size _When_ the list endpoint is invoked with a page size parameter _Then_ the system returns a single page of buildings and a next cursor for retrieving subsequent buildings
  - _Given_ a valid next cursor from a previous list response _When_ the list endpoint is invoked with that cursor _Then_ the system returns the next page of buildings
- **Building representation** _(must, functional)_ — The system SHALL represent a Building with exactly the fields id, name, and address, and SHALL NOT persist additional fields supplied by clients.
  - _Given_ any persisted Building _When_ the record is inspected _Then_ it contains exactly the fields id, name, and address
- **Building in-memory persistence** _(must, nonfunctional)_ — The system SHALL store all Building data in memory only, without disk persistence, snapshotting, or file-based survival, and SHALL initialize the store empty on startup.
  - _Given_ a Building has been persisted _When_ the process is restarted _Then_ no Building data from the previous process lifecycle remains
  - _Given_ the service has just started _When_ the Building store is inspected _Then_ the store contains no seed data

## Domain rules

- **A Building entity has exactly the fields id, name, and address.**
  - _Why:_ Schema defined by the product owner.
- **A Building name must not exceed 80 characters and a Building address must not exceed 160 characters.**
  - _Why:_ Input validation rules provided by the product owner.
- **No uniqueness constraints apply to the Building name or address fields.**
  - _Why:_ The product owner stated there are no uniqueness constraints beyond the identifier.
- **Deletion of a Building permanently removes it from the in-memory store.**
  - _Why:_ The product owner specified hard delete.
- **Building data persists only in memory for the lifetime of the process.**
  - _Why:_ The product owner specified fully transient data.
