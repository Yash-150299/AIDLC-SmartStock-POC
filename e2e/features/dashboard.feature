Feature: Dashboard
  As a signed-in store user
  I want to see live inventory summary and overview on the dashboard
  So that I can understand stock health at a glance

  Background:
    Given I am logged in as "manager"

  @smoke @dashboard
  Scenario: Dashboard shows the four summary cards
    Then I should see the summary card "Total Products"
    And I should see the summary card "Total Stock Units"
    And I should see the summary card "Low Stock Items"
    And I should see the summary card "Out of Stock Items"

  @dashboard
  Scenario: The inventory overview table is paginated at 10 rows
    Then the inventory overview table should show at most 10 rows
    And I should see the pagination summary text

  @dashboard
  Scenario: Refreshing the dashboard keeps the summary cards visible
    When I click the Refresh button
    Then I should see the summary card "Total Products"
