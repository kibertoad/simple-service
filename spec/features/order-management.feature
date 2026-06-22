Feature: Order Management
  Capabilities for creating, reading, listing, and deleting Order resources with a fixed id/status/timestamp schema, system-generated UUID identifiers, a restricted status vocabulary, and thread-safe in-memory persistence.

  @must
  Scenario: Create Order endpoint (#1)
    Given a status value of "active", "cancelled", or "completed" and a provided timestamp
    When a create request is submitted
    Then the system stores an Order with a generated UUID, the given status, and the given timestamp, and returns a success response

  @must
  Scenario: Create Order endpoint (#2)
    Given a status value outside the allowed set
    When a create request is submitted
    Then the system rejects the request and does not create an Order

  @must
  Scenario: Create Order endpoint (#3)
    Given a create request that is missing a status
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create Order endpoint (#4)
    Given a create request that is missing a timestamp
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create Order endpoint (#5)
    Given a create request that includes extra fields beyond status and timestamp
    When the request is processed
    Then the persisted Order contains only id, status, and timestamp; any additional fields are discarded

  @must
  Scenario: Read Order endpoint (#1)
    Given an Order exists with a specific UUID
    When a read request is submitted for that UUID
    Then the system returns the Order's id, status, and timestamp

  @must
  Scenario: Read Order endpoint (#2)
    Given no Order exists for the requested UUID
    When a read request is submitted
    Then the system indicates that the Order was not found

  @must
  Scenario: Read Order endpoint (#3)
    Given a read request with a value that is not a UUID
    When the request is processed
    Then the system indicates that the Order was not found

  @must
  Scenario: List Orders endpoint (#1)
    Given one or more Orders exist in the store
    When a list request is submitted
    Then the system returns a collection containing every Order

  @must
  Scenario: List Orders endpoint (#2)
    Given no Orders exist in the store
    When a list request is submitted
    Then the system returns an empty collection

  @must
  Scenario: Delete Order endpoint (#1)
    Given an Order exists with a specific UUID
    When a delete request is submitted for that UUID
    Then the system removes the Order from the store and returns a success response

  @must
  Scenario: Delete Order endpoint (#2)
    Given no Order exists for the requested UUID
    When a delete request is submitted
    Then the system completes the request without modifying the store

  @must
  Scenario: Delete Order endpoint (#3)
    Given a delete request with a value that is not a UUID
    When the request is processed
    Then the system completes the request without modifying the store

  @must
  Scenario: UUID identifier generation for Orders (#1)
    Given an Order creation request
    When the system persists the Order
    Then the id value is a valid, system-generated UUID

  @must
  Scenario: UUID identifier generation for Orders (#2)
    Given two independent Order creation requests
    When both Orders are persisted
    Then each Order is assigned a distinct id

  @must
  Scenario: UUID identifier generation for Orders (#3)
    Given a creation request that includes a client-supplied id
    When the request is processed
    Then the system ignores the supplied id and assigns its own UUID

  @must
  Scenario: Order status validation (#1)
    Given a create request with status "active"
    When the request is processed
    Then the Order is created

  @must
  Scenario: Order status validation (#2)
    Given a create request with status "cancelled"
    When the request is processed
    Then the Order is created

  @must
  Scenario: Order status validation (#3)
    Given a create request with status "completed"
    When the request is processed
    Then the Order is created

  @must
  Scenario: Order status validation (#4)
    Given a create request with a status value that is not exactly "active", "cancelled", or "completed" (for example "pending" or case variants such as "Active")
    When the request is processed
    Then the system rejects the request and does not create an Order

  @must
  Scenario: Order representation (#1)
    Given any persisted Order
    When the record is inspected
    Then it contains exactly the fields id, status, and timestamp

  @must
  Scenario: Order representation (#2)
    Given an Order has been created
    When the persisted record is retrieved
    Then no extra computed or metadata fields are present beyond id, status, and timestamp

  @must
  Scenario: Order in-memory persistence (#1)
    Given an Order has been persisted
    When the running process serves subsequent read, list, and delete requests
    Then the Order record remains available within the same process instance

  @must
  Scenario: Order in-memory persistence (#2)
    Given an Order has been persisted
    When the process is restarted
    Then the previously persisted Order records are no longer present

  @must
  Scenario: Thread-safe store access (#1)
    Given multiple concurrent create requests for Orders
    When all requests are processed
    Then each Order is stored exactly once with a unique id and without data corruption

  @must
  Scenario: Thread-safe store access (#2)
    Given concurrent read or list requests while Orders are being created or deleted
    When all requests are processed
    Then the responses are internally consistent and do not observe torn or partially updated records

  @must
  Scenario: Thread-safe store access (#3)
    Given concurrent delete requests for the same Order UUID
    When all requests are processed
    Then the Order is removed from the store and the store remains consistent
