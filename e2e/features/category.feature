Feature: Add product category
  As a signed-in store user
  I want to add a new product category from the dashboard quick action
  So that categories are dynamic and extensible

  Background:
    Given I am logged in as "manager"

  @category
  Scenario: Add a new category via the dashboard quick action
    When I open the Add Category dialog
    And I submit a new category with a unique name
    Then I should see the category-added confirmation

  @category
  Scenario: Adding a blank category name is rejected
    When I open the Add Category dialog
    And I submit the category with a blank name
    Then I should see a category name validation error
