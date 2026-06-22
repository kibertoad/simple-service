Feature: User CRUD Operations
  Core CRUD functionality for user management

  @must
  Scenario: Create User (#1)
    Given A user with valid `id`, `name`, and `email` fields
    When The create operation is invoked
    Then The user is stored in the in-memory database

  @must
  Scenario: Create User (#2)
    Given A user with invalid `email` format
    When The create operation is invoked
    Then The operation fails with an error

  @must
  Scenario: Retrieve User by ID (#1)
    Given A user exists in the in-memory database with a known `id`
    When The read operation is invoked with the `id`
    Then The user’s data is returned

  @must
  Scenario: Retrieve User by ID (#2)
    Given A user does not exist in the in-memory database
    When The read operation is invoked with a non-existent `id`
    Then The operation fails with an error

  @must
  Scenario: Update User (#1)
    Given A user exists in the in-memory database with a known `id`
    When An update operation is invoked with new `name` or `email` values
    Then The user’s data is modified in the in-memory database

  @must
  Scenario: Update User (#2)
    Given An update attempt with invalid `email` format
    When The update operation is invoked
    Then The operation fails with an error

  @must
  Scenario: Delete User (#1)
    Given A user exists in the in-memory database with a known `id`
    When The delete operation is invoked with the `id`
    Then The user is removed from the in-memory database

  @must
  Scenario: Delete User (#2)
    Given A delete attempt for a non-existent `id`
    When The delete operation is invoked
    Then The operation fails with an error

  @must
  Scenario: Email Validation (#1)
    Given A user attempt to create or update with an invalid `email`
    When The operation is invoked
    Then The operation fails with an error

  @must
  Scenario: Email Validation (#2)
    Given A user attempt to create or update with a valid `email`
    When The operation is invoked
    Then The operation succeeds
