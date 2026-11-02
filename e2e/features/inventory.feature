Feature: Inventory navigation and filtering
  As a signed-in store user
  I want the dashboard tiles to take me to a filtered inventory list
  So that I can quickly act on low and out-of-stock items

  Background:
    Given I am logged in as "manager"

  @smoke @inventory
  Scenario: Clicking the Low Stock tile opens the inventory filtered to low stock
    When I click the "Low Stock Items" summary card
    Then I should be on the inventory page
    And the stock status filter should be set to "Low stock"

  @inventory
  Scenario: Clicking the Out of Stock tile opens the inventory filtered to out of stock
    When I click the "Out of Stock Items" summary card
    Then I should be on the inventory page
    And the stock status filter should be set to "Out of stock"

  @inventory
  Scenario: Clicking the Total Products tile opens the full inventory list
    When I click the "Total Products" summary card
    Then I should be on the inventory page
    And I should see the "Add product" action
