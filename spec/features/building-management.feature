Feature: Building Management
  Capabilities for creating, retrieving, updating, deleting, and listing Building resources with unique identifiers, name and address fields, and cursor-based pagination over a transient in-memory store.

  @must
  Scenario: Create Building endpoint (#1)
    Given a creation request containing a name not exceeding 80 characters and an address not exceeding 160 characters
    When the request is processed
    Then the system stores the Building with a unique identifier and returns the Building record

  @must
  Scenario: Create Building endpoint (#2)
    Given a creation request containing a name exceeding 80 characters
    When the request is processed
    Then the system performs basic error handling and does not create the Building

  @must
  Scenario: Create Building endpoint (#3)
    Given a creation request containing an address exceeding 160 characters
    When the request is processed
    Then the system performs basic error handling and does not create the Building

  @must
  Scenario: Create Building endpoint (#4)
    Given a creation request containing a missing name or address
    When the request is processed
    Then the system performs basic error handling and does not create the Building

  @must
  Scenario: Retrieve Building endpoint (#1)
    Given a Building exists for the provided identifier
    When the request is processed
    Then the system returns the Building record

  @must
  Scenario: Retrieve Building endpoint (#2)
    Given no Building exists for the provided identifier
    When the request is processed
    Then the system performs basic error handling

  @must
  Scenario: Update Building endpoint (#1)
    Given a stored Building and a request containing a name not exceeding 80 characters and an address not exceeding 160 characters
    When the request is processed
    Then the system modifies the record and returns the updated Building

  @must
  Scenario: Update Building endpoint (#2)
    Given no Building exists for the provided identifier
    When an update request is processed
    Then the system performs basic error handling

  @must
  Scenario: Update Building endpoint (#3)
    Given an update request containing a name exceeding 80 characters
    When the request is processed
    Then the system performs basic error handling and does not modify the Building

  @must
  Scenario: Update Building endpoint (#4)
    Given an update request containing an address exceeding 160 characters
    When the request is processed
    Then the system performs basic error handling and does not modify the Building

  @must
  Scenario: Delete Building endpoint (#1)
    Given a stored Building
    When a delete request is processed
    Then the system permanently removes the record from the in-memory store

  @must
  Scenario: Delete Building endpoint (#2)
    Given no Building exists for the provided identifier
    When a delete request is processed
    Then the system performs basic error handling

  @must
  Scenario: List Buildings endpoint (#1)
    Given zero stored buildings
    When the list endpoint is invoked
    Then the system returns a paginated collection with no items

  @must
  Scenario: List Buildings endpoint (#2)
    Given fewer buildings than the page size
    When the list endpoint is invoked
    Then the system returns all buildings and a pagination response indicating no next cursor

  @must
  Scenario: List Buildings endpoint (#3)
    Given more buildings than the page size
    When the list endpoint is invoked with a page size parameter
    Then the system returns a single page of buildings and a next cursor for retrieving subsequent buildings

  @must
  Scenario: List Buildings endpoint (#4)
    Given a valid next cursor from a previous list response
    When the list endpoint is invoked with that cursor
    Then the system returns the next page of buildings

  @must
  Scenario: Building representation
    Given any persisted Building
    When the record is inspected
    Then it contains exactly the fields id, name, and address

  @must
  Scenario: Building in-memory persistence (#1)
    Given a Building has been persisted
    When the process is restarted
    Then no Building data from the previous process lifecycle remains

  @must
  Scenario: Building in-memory persistence (#2)
    Given the service has just started
    When the Building store is inspected
    Then the store contains no seed data
