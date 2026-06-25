Feature: Office Table Management — Office Table Management
  Capabilities for creating, retrieving, listing, updating, and deleting physical office furniture (office table) resources with UUIDv7 identifiers, non-negative price validation, fixed id/price/date-bought representation, full-replacement updates, direct JSON payloads, cursor-based pagination, and no API version prefixes.

  @must
  Scenario: Office Table CRUD endpoints
    Given the service is running
    When its API is inspected
    Then it exposes RESTful endpoints supporting all CRUD operations for office tables

  @must
  Scenario: Office Table representation (#1)
    Given a request to create an office table
    When the resource is created
    Then the system assigns a UUIDv7 identifier and stores the provided price and date bought

  @must
  Scenario: Office Table representation (#2)
    Given any stored office table
    When retrieved
    Then its JSON representation contains id, price, and date bought

  @must
  Scenario: Office Table representation (#3)
    Given a creation request that includes a client-supplied id
    When the request is processed
    Then the system ignores the supplied id and assigns its own UUIDv7 identifier

  @must
  Scenario: Office Table price validation (#1)
    Given a request payload with a negative price
    When the create endpoint processes the request
    Then the system returns an HTTP status code consistent with common REST conventions indicating a client validation error and does not persist the invalid resource

  @must
  Scenario: Office Table price validation (#2)
    Given a request payload with a negative price for an existing office table
    When the update endpoint processes the request
    Then the system returns an HTTP status code consistent with common REST conventions indicating a client validation error and does not persist the invalid resource

  @must
  Scenario: Office Table price validation (#3)
    Given a request payload with a zero price
    When the create or update endpoint processes the request
    Then the operation succeeds because zero is a non-negative price

  @must
  Scenario: Retrieve Office Table endpoint (#1)
    Given an existing office table UUIDv7 identifier
    When the retrieve endpoint is invoked
    Then the system returns the resource directly as JSON with an HTTP status code consistent with common REST conventions for a successful retrieval

  @must
  Scenario: Retrieve Office Table endpoint (#2)
    Given a non-existent UUIDv7 identifier
    When the retrieve endpoint is invoked
    Then the system returns an HTTP status code consistent with common REST conventions indicating the resource was not found

  @must
  Scenario: List Office Tables endpoint
    Given multiple office tables exist in the store
    When the list endpoint is invoked
    Then the system returns a paginated collection directly as JSON using cursor-based pagination

  @must
  Scenario: Office Table full replacement update
    Given an existing office table
    When an update request is received with a payload
    Then the system replaces all stored fields with the payload contents and returns the updated resource

  @must
  Scenario: Direct JSON payloads
    Given any successful CRUD operation for office tables
    When the response is returned
    Then the body contains the resource or collection directly without a data envelope

  @must
  Scenario: Office Table in-memory persistence
    Given the service has stored office tables
    When the service process restarts
    Then no office table data from the previous process lifecycle remains

  @must
  Scenario: No API version prefixes
    Given any endpoint URL for office tables
    When inspected
    Then it does not contain a version path segment such as /v1/

  @must
  Scenario: Office Table REST interface conventions (#1)
    Given a valid request to an office table endpoint using the HTTP method associated with the requested operation
    When the request is processed
    Then the response uses an HTTP status code consistent with common REST conventions for that operation

  @must
  Scenario: Office Table REST interface conventions (#2)
    Given a request to an office table endpoint using an HTTP method not supported by that endpoint
    When the request is processed
    Then the response uses an HTTP status code consistent with common REST conventions indicating the method is not allowed

  @must
  Scenario: Office Table REST interface conventions (#3)
    Given an invalid request payload for an office table create or update operation
    When the request is processed
    Then the response uses an HTTP status code consistent with common REST conventions indicating a client validation error

  @must
  Scenario: Office Table in-memory response times (#1)
    Given the in-memory store contains office table data
    When any CRUD operation is performed
    Then the operation completes without disk I/O or durable storage access

  @must
  Scenario: Office Table in-memory response times (#2)
    Given the service is processing office table requests
    When response times are observed
    Then CRUD operations complete within a timeframe characteristic of in-memory data access
