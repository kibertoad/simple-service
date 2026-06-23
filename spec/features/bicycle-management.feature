Feature: Bicycle Management
  Capabilities for typical CRUD operations on Bicycle resources using a transient in-memory store.

  @must
  Scenario: Bicycle CRUD endpoints (#1)
    Given a valid create request for a Bicycle
    When the request is processed
    Then the Bicycle is persisted with a system-generated unique identifier and returned

  @must
  Scenario: Bicycle CRUD endpoints (#2)
    Given a stored Bicycle and a valid identifier
    When the retrieve request is processed
    Then the system returns the Bicycle record

  @must
  Scenario: Bicycle CRUD endpoints (#3)
    Given a Bicycle identifier that does not exist
    When the retrieve request is processed
    Then the system performs error handling indicating the resource was not found

  @must
  Scenario: Bicycle CRUD endpoints (#4)
    Given one or more stored Bicycles and a list request
    When the request is processed
    Then the system returns a collection of Bicycle records with cursor-based pagination

  @must
  Scenario: Bicycle CRUD endpoints (#5)
    Given a stored Bicycle and a valid full-update request
    When the request is processed
    Then the system replaces the stored Bicycle fields and returns the updated record

  @must
  Scenario: Bicycle CRUD endpoints (#6)
    Given a non-existent Bicycle identifier on update
    When the request is processed
    Then the system performs error handling indicating the resource was not found

  @must
  Scenario: Bicycle CRUD endpoints (#7)
    Given a stored Bicycle identifier
    When the delete request is processed
    Then the system permanently removes the Bicycle from the in-memory store

  @must
  Scenario: Bicycle CRUD endpoints (#8)
    Given a non-existent Bicycle identifier on delete
    When the request is processed
    Then the system performs error handling indicating the resource was not found

  @must
  Scenario: Bicycle identifier and representation (#1)
    Given a Bicycle creation request
    When the Bicycle is persisted
    Then the id value is a valid, system-generated identifier

  @must
  Scenario: Bicycle identifier and representation (#2)
    Given two independent Bicycle creation requests
    When both Bicycles are persisted
    Then each Bicycle is assigned a distinct id

  @must
  Scenario: Bicycle identifier and representation (#3)
    Given any persisted Bicycle
    When the record is inspected
    Then it contains the expected fixed fields and no extra computed fields

  @must
  Scenario: Bicycle in-memory persistence
    Given a Bicycle has been persisted
    When the process is restarted
    Then no Bicycle data from the previous process lifecycle remains
