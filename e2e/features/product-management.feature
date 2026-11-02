Feature: Product management and stock adjustment
  As a signed-in store user
  I want to create, edit, view and adjust products through the UI
  So that inventory stays accurate and every core flow is verified end-to-end

  # P1 gap-closing scenarios authored by the AIDLC Quality Agent to cover the
  # core CRUD and stock-adjustment flows (FR-21..FR-31, FR-41, FR-42, FR-48)
  # that the initial smoke suite did not exercise.

  Background:
    Given I am logged in as "manager"

  @product @add @smoke
  Scenario: Add a new product with valid data
    When I open the Add Product page
    And I create a product with a unique SKU and valid details
    Then I should be taken to the product details page
    And the product details should show the stock status

  @product @add @validation
  Scenario: Adding a product with a duplicate SKU is rejected
    When I open the Add Product page
    And I try to create a product using an existing SKU
    Then I should see a duplicate-SKU error
    And I should remain on the Add Product page

  @product @add @validation
  Scenario: Adding a product with a negative price is rejected
    When I open the Add Product page
    And I try to create a product with a negative unit price
    Then I should see a validation error on the form
    And I should remain on the Add Product page

  @product @edit
  Scenario: Edit a product and persist the change
    When I open the first product's details
    And I edit the product reorder level to a new value
    Then the change should be persisted on the details page

  @product @details
  Scenario: Product details show the full record
    When I open the first product's details
    Then the details page should show stock, reorder level, unit price and status

  @stock @adjust @smoke
  Scenario: Record a Stock In adjustment increases stock
    When I open the first product's details
    And I record a "Stock In" adjustment of 5 with a reason
    Then the adjustment should succeed

  @stock @adjust @validation
  Scenario: A Stock Out beyond available stock is rejected (no negative stock)
    When I open the first product's details
    And I record a "Stock Out" adjustment larger than current stock
    Then I should see a negative-stock error

  @stock @history
  Scenario: Stock adjustment history is viewable
    When I open the first product's details
    And I record a "Stock In" adjustment of 3 with a reason
    And I open the adjustment history
    Then I should see at least one adjustment entry
