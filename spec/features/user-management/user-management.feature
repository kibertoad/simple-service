Feature: User Management — User Management
  Capabilities for creating and fully replacing User resources with a fixed id/name/email schema, UUID generation, and email uniqueness enforced in an in-memory store.

  @must
  Scenario: Create User endpoint (#1)
    Given a creation request containing valid values for name and email
    When the request is processed
    Then a new User is persisted with a system-generated UUID as its id, and a success response is returned

  @must
  Scenario: Create User endpoint (#2)
    Given a creation request that does not include a name
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create User endpoint (#3)
    Given a creation request that does not include an email
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create User endpoint (#4)
    Given a creation request that includes an email already held by a persisted User
    When the request is processed
    Then the system rejects the request to preserve email uniqueness

  @must
  Scenario: Create User endpoint (#5)
    Given a creation request that includes extra fields beyond name and email
    When the request is processed
    Then the persisted User contains only id, name, and email; any additional fields are discarded

  @must
  Scenario: Replace User endpoint (#1)
    Given an existing User and a replace request containing a complete User record including id, name, and email
    When the request is processed
    Then the stored User is fully replaced with the supplied record, and a success response is returned

  @must
  Scenario: Replace User endpoint (#2)
    Given a replace request referencing an id that does not identify any persisted User
    When the request is processed
    Then the system rejects the request because the target User does not exist

  @must
  Scenario: Replace User endpoint (#3)
    Given a replace request for an existing User where the request body is missing name, email, or id
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Replace User endpoint (#4)
    Given a replace request where the id in the request body does not match the targeted User's id
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Replace User endpoint (#5)
    Given a replace request for an existing User that repeats the User's own current email
    When the request is processed
    Then the replacement succeeds and the User remains uniquely represented

  @must
  Scenario: Replace User endpoint (#6)
    Given a replace request for an existing User that specifies an email already held by a different User
    When the request is processed
    Then the system rejects the request to preserve email uniqueness

  @must
  Scenario: Replace User endpoint (#7)
    Given a replace request for an existing User that includes extra fields beyond id, name, and email
    When the request is processed
    Then the persisted User contains only id, name, and email; any additional fields are discarded

  @must
  Scenario: UUID identifier generation (#1)
    Given a User creation request
    When the system persists the User
    Then the id value is a valid, system-generated UUID

  @must
  Scenario: UUID identifier generation (#2)
    Given two independent User creation requests
    When both Users are persisted
    Then each User is assigned a distinct id

  @must
  Scenario: UUID identifier generation (#3)
    Given a creation request that includes a client-supplied id
    When the request is processed
    Then the system ignores the supplied id and assigns its own UUID

  @must
  Scenario: UUID identifier generation (#4)
    Given an existing User
    When a replace request is processed
    Then the User's id remains unchanged from the value assigned at creation

  @must
  Scenario: Email uniqueness (#1)
    Given a User already exists with a specific email address
    When a creation request specifies that same email
    Then the system rejects the request

  @must
  Scenario: Email uniqueness (#2)
    Given a User already exists with a specific email address
    When a replace request for a different User specifies that same email
    Then the system rejects the request

  @must
  Scenario: Email uniqueness (#3)
    Given a User already exists with a specific email address
    When a replace request for that same User repeats the current email
    Then the replacement succeeds and uniqueness is maintained

  @must
  Scenario: Email uniqueness (#4)
    Given no persisted User has a specific email address
    When a creation or replace request specifies that email
    Then the operation succeeds and the new email is stored

  @must
  Scenario: User representation (#1)
    Given any persisted User
    When the record is inspected
    Then it contains exactly the fields id, name, and email

  @must
  Scenario: User representation (#2)
    Given a User has been created or replaced
    When the persisted record is retrieved
    Then no extra computed or metadata fields are present beyond id, name, and email

  @must
  Scenario: In-memory persistence (#1)
    Given a User has been persisted
    When the running process serves subsequent requests
    Then the User record remains available and can be replaced within the same process instance

  @must
  Scenario: In-memory persistence (#2)
    Given a User has been persisted
    When the process is restarted
    Then the previously persisted User records are no longer present
