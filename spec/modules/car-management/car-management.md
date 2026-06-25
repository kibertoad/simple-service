# Car Management — Car Management

Capabilities for typical CRUD operations on Car resources using a transient in-memory store.

## Requirements

- **Car CRUD endpoints** _(must, functional)_ — The system SHALL expose REST endpoints to create, retrieve, list, update, and delete Car resources, using an in-memory store.
  - _Given_ a valid create request for a Car _When_ the request is processed _Then_ the Car is persisted with a system-generated unique identifier and returned
  - _Given_ a stored Car and a valid identifier _When_ the retrieve request is processed _Then_ the system returns the Car record
  - _Given_ a Car identifier that does not exist _When_ the retrieve request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ one or more stored Cars and a list request _When_ the request is processed _Then_ the system returns a collection of Car records with cursor-based pagination
  - _Given_ a stored Car and a valid full-update request _When_ the request is processed _Then_ the system replaces the stored Car fields and returns the updated record
  - _Given_ a non-existent Car identifier on update _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ a stored Car identifier _When_ the delete request is processed _Then_ the system permanently removes the Car from the in-memory store
  - _Given_ a non-existent Car identifier on delete _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
- **Car identifier and representation** _(must, functional)_ — The system SHALL generate a unique identifier for each Car upon creation and represent a Car with a fixed set of fields.
  - _Given_ a Car creation request _When_ the Car is persisted _Then_ the id value is a valid, system-generated identifier
  - _Given_ two independent Car creation requests _When_ both Cars are persisted _Then_ each Car is assigned a distinct id
  - _Given_ any persisted Car _When_ the record is inspected _Then_ it contains the expected fixed fields and no extra computed fields
- **Car in-memory persistence** _(must, nonfunctional)_ — The system SHALL persist all Car data in memory only, with an empty store on startup and no data survival across restarts.
  - _Given_ a Car has been persisted _When_ the process is restarted _Then_ no Car data from the previous process lifecycle remains

## Domain rules

- **A Car entity has a fixed set of fields and a system-generated unique identifier, and persists only in memory for the lifetime of the process.**
  - _Why:_ Ensures a predictable transient model for simple CRUD.
