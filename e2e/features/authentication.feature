Feature: Authentication
  As a store user
  I want to sign in to SmartStock and sign out safely
  So that only authorized users can manage inventory

  Background:
    Given I am on the login page

  @smoke @auth
  Scenario: Successful login with valid demo credentials
    When I log in with username "manager" and password "Password123!"
    Then I should land on the dashboard
    And I should see the signed-in user "manager"

  @auth
  Scenario: Login is rejected with invalid credentials
    When I log in with username "manager" and password "WrongPassword!"
    Then I should see an invalid-credentials error
    And I should remain on the login page

  @auth
  Scenario: A protected page redirects an unauthenticated user to login
    When I navigate directly to the inventory page
    Then I should remain on the login page

  @auth
  Scenario: Logout shows a confirmation modal and signs the user out
    Given I am logged in as "manager"
    When I click the Logout button
    Then I should see a logout confirmation dialog
    When I confirm the logout
    Then I should be back on the login page
