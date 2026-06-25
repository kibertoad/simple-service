Feature: Car Management — Car Management
  Capabilities for typical CRUD operations on Car resources using a transient in-memory store.

  @must
  Scenario: Car CRUD endpoints (#1)
    Given a valid create request for a Car
    When the request is processed
    Then the Car is persisted with a system-generated unique identifier and returned

  @must
  Scenario: Car CRUD endpoints (#2)
    Given a stored Car and a valid identifier
    When the retrieve request is processed
    Then the system returns the Car record

  @must
  Scenario: Car CRUD endpoints (#3)
    Given a Car identifier that does not exist
    When the retrieve request is processed
    Then the system performs error handling indicating the resource was not found

  @must
  Scenario: Car CRUD endpoints (#4)
    Given one or more stored Cars and a list request
    When the request is processed
    Then the system returns a collection of Car records with cursor-based pagination

  @must
  Scenario: Car CRUD endpoints (#5)
    Given a stored Car and a valid full-update request
    When the request is processed
    Then the system replaces the stored Car fields and returns the updated record

  @must
  Scenario: Car CRUD endpoints (#6)
    Given a non-existent Car identifier on update
    When the request is processed
    Then the system performs error handling indicating the resource was not found

  @must
  Scenario: Car CRUD endpoints (#7)
    Given a stored Car identifier
    When the delete request is processed
    Then the system permanently removes the Car from the in-memory store

  @must
  Scenario: Car CRUD endpoints (#8)
    Given a non-existent Car identifier on delete
    When the request is processed
    Then the system performs error handling indicating the resource was not found

  @must
  Scenario: Car identifier and representation (#1)
    Given a Car creation request
    When the Car is persisted
    Then the id value is a valid, system-generated identifier

  @must
  Scenario: Car identifier and representation (#2)
    Given two independent Car creation requests
    When both Cars are persisted
    Then each Car is assigned a distinct id

  @must
  Scenario: Car identifier and representation (#3)
    Given any persisted Car
    When the record is inspected
    Then it contains the expected fixed fields and no extra computed fields

  @must
  Scenario: Car in-memory persistence
    Given a Car has been persisted
    When the process is restarted
    Then no Car data from the previous process lifecycle remains
