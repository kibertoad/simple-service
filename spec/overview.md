# User CRUD Service — Requirements

> Generated, prescriptive requirements for this service (what MUST be
> true). Read this first. `rules.md` lists cross-cutting invariants;
> `features/*.feature` are the acceptance scenarios your work must satisfy.

A service implementing CRUD operations for user data with in-memory storage, validation, and minimal functional scope.

## User CRUD Operations

Core CRUD functionality for user management

- **Create User** _(must, functional)_ — The system SHALL create a user
  - _Given_ A user with valid `id`, `name`, and `email` fields _When_ The create operation is invoked _Then_ The user is stored in the in-memory database
  - _Given_ A user with invalid `email` format _When_ The create operation is invoked _Then_ The operation fails with an error
- **Retrieve User by ID** _(must, functional)_ — The system SHALL retrieve a user by ID
  - _Given_ A user exists in the in-memory database with a known `id` _When_ The read operation is invoked with the `id` _Then_ The user’s data is returned
  - _Given_ A user does not exist in the in-memory database _When_ The read operation is invoked with a non-existent `id` _Then_ The operation fails with an error
- **Update User** _(must, functional)_ — The system SHALL update a user’s details
  - _Given_ A user exists in the in-memory database with a known `id` _When_ An update operation is invoked with new `name` or `email` values _Then_ The user’s data is modified in the in-memory database
  - _Given_ An update attempt with invalid `email` format _When_ The update operation is invoked _Then_ The operation fails with an error
- **Delete User** _(must, functional)_ — The system SHALL delete a user by ID
  - _Given_ A user exists in the in-memory database with a known `id` _When_ The delete operation is invoked with the `id` _Then_ The user is removed from the in-memory database
  - _Given_ A delete attempt for a non-existent `id` _When_ The delete operation is invoked _Then_ The operation fails with an error
- **Email Validation** _(must, functional)_ — The system SHALL validate email format during creation and update
  - _Given_ A user attempt to create or update with an invalid `email` _When_ The operation is invoked _Then_ The operation fails with an error
  - _Given_ A user attempt to create or update with a valid `email` _When_ The operation is invoked _Then_ The operation succeeds

## Non-Functional Requirements

Quality attributes and system constraints

- **In-Memory Storage** _(must, functional)_ — The system SHALL use in-memory storage
- **No Authentication** _(must, functional)_ — The system SHALL not require authentication
