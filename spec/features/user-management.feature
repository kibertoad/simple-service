Feature: User Management
  Core user management operations

  @must
  Scenario: Create User (#1)
    Given User data with valid unique ID and required fields
    When The create user API is called
    Then User is successfully created and stored in memory

  @must
  Scenario: Create User (#2)
    Given User data with existing ID
    When The create user API is called
    Then Error response indicating duplicate ID is returned

  @must
  Scenario: Create User (#3)
    Given User data with missing required fields
    When The create user API is called
    Then Error response indicating invalid data format is returned

  @must
  Scenario: Read User (#1)
    Given Valid user ID
    When The read user API is called
    Then User data is returned successfully

  @must
  Scenario: Read User (#2)
    Given Invalid user ID
    When The read user API is called
    Then Error response indicating user not found is returned

  @must
  Scenario: Update User (#1)
    Given Valid user ID and update data
    When The update user API is called
    Then User data is successfully updated

  @must
  Scenario: Update User (#2)
    Given Invalid user ID
    When The update user API is called
    Then Error response indicating user not found is returned

  @must
  Scenario: Update User (#3)
    Given Partial update data
    When The update user API is called
    Then Only provided fields are updated while others remain unchanged

  @must
  Scenario: Delete User (#1)
    Given Valid user ID
    When The delete user API is called
    Then User is successfully removed from storage

  @must
  Scenario: Delete User (#2)
    Given Invalid user ID
    When The delete user API is called
    Then Error response indicating user not found is returned
