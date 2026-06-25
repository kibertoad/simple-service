Feature: Bear CRUD — Bear CRUD
  Capabilities for creating, reading, listing, updating, and deleting Bear resources with id/name/age/colour schema, UUIDv7 generation, validation rules for name and age, freeform colour, and cursor-based pagination backed by in-memory storage.

  @must
  Scenario: Create Bear (#1)
    Given a non-empty, unique name no longer than 100 characters that also satisfies applicable character/pattern restrictions, a non-negative integer age, and a freeform colour
    When a create request is submitted
    Then the system stores the bear and returns the record including the generated UUIDv7 identifier

  @must
  Scenario: Create Bear (#2)
    Given a create request with an empty name
    When the request is submitted
    Then the system rejects the request

  @must
  Scenario: Create Bear (#3)
    Given a create request with a name that exceeds 100 characters
    When the request is submitted
    Then the system rejects the request

  @must
  Scenario: Create Bear (#4)
    Given a create request with a name that duplicates an existing bear name
    When the request is submitted
    Then the system rejects the request

  @must
  Scenario: Create Bear (#5)
    Given a create request with a name that violates applicable character/pattern restrictions
    When the request is submitted
    Then the system rejects the request

  @must
  Scenario: Create Bear (#6)
    Given a create request with a negative age
    When the request is submitted
    Then the system rejects the request

  @must
  Scenario: Create Bear (#7)
    Given a create request with an age that is not an integer
    When the request is submitted
    Then the system rejects the request

  @must
  Scenario: Read Bear (#1)
    Given a bear exists with a known UUIDv7 identifier
    When a read request is made for that identifier
    Then the system returns the corresponding bear record

  @must
  Scenario: Read Bear (#2)
    Given a read request for a UUIDv7 identifier that does not exist
    When the request is made
    Then the system indicates that the bear was not found

  @must
  Scenario: List Bears (#1)
    Given one or more bears exist in storage
    When a list request is made
    Then the system returns a paginated result set using cursor-based pagination

  @must
  Scenario: List Bears (#2)
    Given no bears exist
    When a list request is made
    Then the system returns an empty paginated result set

  @must
  Scenario: Update Bear (#1)
    Given an existing bear and a replacement representation that satisfies all creation validation rules
    When an update request is submitted
    Then the system overwrites the bear's mutable fields and returns the updated record

  @must
  Scenario: Update Bear (#2)
    Given an update request with an invalid age
    When the request is submitted
    Then the system rejects the update

  @must
  Scenario: Update Bear (#3)
    Given an update request with a duplicate name
    When the request is submitted
    Then the system rejects the update

  @must
  Scenario: Update Bear (#4)
    Given an update request with an empty name
    When the request is submitted
    Then the system rejects the update

  @must
  Scenario: Update Bear (#5)
    Given an update request that omits one or more mutable fields
    When the request is submitted
    Then the system applies full replacement semantics and stores exactly the provided values

  @must
  Scenario: Delete Bear (#1)
    Given an existing bear
    When a delete request is made by identifier
    Then the system removes the bear from storage

  @must
  Scenario: Delete Bear (#2)
    Given a delete request for a UUIDv7 identifier that does not exist
    When the request is made
    Then the system indicates that the bear was not found

  @must
  Scenario: Bear in-memory persistence
    Given bears have been created in the service
    When the service process restarts
    Then no bear records remain

  Scenario: In-memory operation latency
    Given bear CRUD operations are executed
    When the system processes them
    Then responses are produced without reliance on external persistence services and with latency consistent with in-memory access

  Scenario: Local UUIDv7 generation
    Given the service generates a bear identifier
    When identifier generation occurs
    Then the identifier is produced using only local runtime capabilities without depending on external network services
