# Bicycle Management — Bicycle Management

Capabilities for typical CRUD operations on Bicycle resources using a transient in-memory store.

## Requirements

- **Bicycle CRUD endpoints** _(must, functional)_ — The system SHALL expose REST endpoints to create, retrieve, list, update, and delete Bicycle resources, using an in-memory store.
  - _Given_ a valid create request for a Bicycle _When_ the request is processed _Then_ the Bicycle is persisted with a system-generated unique identifier and returned
  - _Given_ a stored Bicycle and a valid identifier _When_ the retrieve request is processed _Then_ the system returns the Bicycle record
  - _Given_ a Bicycle identifier that does not exist _When_ the retrieve request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ one or more stored Bicycles and a list request _When_ the request is processed _Then_ the system returns a collection of Bicycle records with cursor-based pagination
  - _Given_ a stored Bicycle and a valid full-update request _When_ the request is processed _Then_ the system replaces the stored Bicycle fields and returns the updated record
  - _Given_ a non-existent Bicycle identifier on update _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ a stored Bicycle identifier _When_ the delete request is processed _Then_ the system permanently removes the Bicycle from the in-memory store
  - _Given_ a non-existent Bicycle identifier on delete _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
- **Bicycle identifier and representation** _(must, functional)_ — The system SHALL generate a unique identifier for each Bicycle upon creation and represent a Bicycle with a fixed set of fields.
  - _Given_ a Bicycle creation request _When_ the Bicycle is persisted _Then_ the id value is a valid, system-generated identifier
  - _Given_ two independent Bicycle creation requests _When_ both Bicycles are persisted _Then_ each Bicycle is assigned a distinct id
  - _Given_ any persisted Bicycle _When_ the record is inspected _Then_ it contains the expected fixed fields and no extra computed fields
- **Bicycle in-memory persistence** _(must, nonfunctional)_ — The system SHALL persist all Bicycle data in memory only, with an empty store on startup and no data survival across restarts.
  - _Given_ a Bicycle has been persisted _When_ the process is restarted _Then_ no Bicycle data from the previous process lifecycle remains

## Domain rules

- **A Bicycle entity has a fixed set of fields and a system-generated unique identifier, and persists only in memory for the lifetime of the process.**
  - _Why:_ Ensures a predictable transient model for simple CRUD.
