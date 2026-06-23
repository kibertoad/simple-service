Feature: Organization Management
  Capabilities for creating and fully replacing Organization resources with a fixed id/name/slug schema, UUID generation, and slug uniqueness enforced in an in-memory store.

  @must
  Scenario: Create Organization endpoint (#1)
    Given a creation request containing valid values for name and slug
    When the request is processed
    Then a new Organization is persisted with a system-generated UUID as its id, and a success response is returned

  @must
  Scenario: Create Organization endpoint (#2)
    Given a creation request that does not include a name
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create Organization endpoint (#3)
    Given a creation request that does not include a slug
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create Organization endpoint (#4)
    Given a creation request that includes a slug already held by a persisted Organization
    When the request is processed
    Then the system rejects the request to preserve slug uniqueness

  @must
  Scenario: Create Organization endpoint (#5)
    Given a creation request that includes a slug not matching the required lowercase-alphanumeric-hyphen format
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Create Organization endpoint (#6)
    Given a creation request that includes extra fields beyond name and slug
    When the request is processed
    Then the persisted Organization contains only id, name, and slug; any additional fields are discarded

  @must
  Scenario: Replace Organization endpoint (#1)
    Given an existing Organization and a replace request containing a complete Organization record including id, name, and slug
    When the request is processed
    Then the stored Organization is fully replaced with the supplied record, and a success response is returned

  @must
  Scenario: Replace Organization endpoint (#2)
    Given a replace request referencing an id that does not identify any persisted Organization
    When the request is processed
    Then the system rejects the request because the target Organization does not exist

  @must
  Scenario: Replace Organization endpoint (#3)
    Given a replace request for an existing Organization where the request body is missing id, name, or slug
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Replace Organization endpoint (#4)
    Given a replace request where the id in the request body does not match the targeted Organization's id
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Replace Organization endpoint (#5)
    Given a replace request for an existing Organization that repeats the Organization's own current slug
    When the request is processed
    Then the replacement succeeds and slug uniqueness is maintained

  @must
  Scenario: Replace Organization endpoint (#6)
    Given a replace request for an existing Organization that specifies a slug already held by a different Organization
    When the request is processed
    Then the system rejects the request to preserve slug uniqueness

  @must
  Scenario: Replace Organization endpoint (#7)
    Given a replace request for an existing Organization that includes a slug not matching the required lowercase-alphanumeric-hyphen format
    When the request is processed
    Then the system rejects the request as invalid

  @must
  Scenario: Replace Organization endpoint (#8)
    Given a replace request for an existing Organization that includes extra fields beyond id, name, and slug
    When the request is processed
    Then the persisted Organization contains only id, name, and slug; any additional fields are discarded

  @must
  Scenario: Organization UUID identifier generation (#1)
    Given an Organization creation request
    When the system persists the Organization
    Then the id value is a valid, system-generated UUID

  @must
  Scenario: Organization UUID identifier generation (#2)
    Given two independent Organization creation requests
    When both Organizations are persisted
    Then each Organization is assigned a distinct id

  @must
  Scenario: Organization UUID identifier generation (#3)
    Given a creation request that includes a client-supplied id
    When the request is processed
    Then the system ignores the supplied id and assigns its own UUID

  @must
  Scenario: Organization UUID identifier generation (#4)
    Given an existing Organization
    When a replace request is processed
    Then the Organization's id remains unchanged from the value assigned at creation

  @must
  Scenario: Slug uniqueness (#1)
    Given an Organization already exists with a specific slug
    When a creation request specifies that same slug
    Then the system rejects the request

  @must
  Scenario: Slug uniqueness (#2)
    Given an Organization already exists with a specific slug
    When a replace request for a different Organization specifies that same slug
    Then the system rejects the request

  @must
  Scenario: Slug uniqueness (#3)
    Given an Organization already exists with a specific slug
    When a replace request for that same Organization repeats the current slug
    Then the replacement succeeds and uniqueness is maintained

  @must
  Scenario: Slug uniqueness (#4)
    Given no persisted Organization has a specific slug
    When a creation or replace request specifies that slug
    Then the operation succeeds and the new slug is stored

  @must
  Scenario: Organization representation (#1)
    Given any persisted Organization
    When the record is inspected
    Then it contains exactly the fields id, name, and slug

  @must
  Scenario: Organization representation (#2)
    Given an Organization has been created or replaced
    When the persisted record is retrieved
    Then no extra computed or metadata fields are present beyond id, name, and slug

  @must
  Scenario: Organization in-memory persistence (#1)
    Given an Organization has been persisted
    When the running process serves subsequent requests
    Then the Organization record remains available and can be replaced within the same process instance

  @must
  Scenario: Organization in-memory persistence (#2)
    Given an Organization has been persisted
    When the process is restarted
    Then the previously persisted Organization records are no longer present
