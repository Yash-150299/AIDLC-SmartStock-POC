import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/fixtures';
import type { Page } from '@playwright/test';

/**
 * Step definitions for the P1 product-management and stock-adjustment scenarios
 * (authored by the AIDLC Quality Agent to close core-CRUD coverage gaps).
 *
 * Selectors target the MUI-based ProductForm / details / adjustment pages using
 * accessible labels and roles, with tolerant fallbacks so the suite is robust
 * against minor layout differences.
 */

/** A SKU that is guaranteed unique per run. */
function uniqueSku(): string {
  return `E2E-${Date.now().toString().slice(-8)}`;
}

/** Fill a labelled MUI text field (matches label text loosely). */
async function fillField(page: Page, label: RegExp, value: string): Promise<void> {
  const field = page.getByLabel(label).first();
  await field.waitFor({ state: 'visible' });
  await field.fill(value);
}

/** Open the first product row's details from the inventory list. */
async function openFirstProductDetails(page: Page): Promise<void> {
  await page.goto('/inventory');
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  // Product names in the table are links to /inventory/:id — click the first one.
  const firstProductLink = page.locator('table tbody tr a').first();
  await firstProductLink.waitFor({ state: 'visible' });
  await firstProductLink.click();
  await expect(page).toHaveURL(/\/inventory\/\d+$/);
}

// --- Add Product ---

When('I open the Add Product page', async ({ page }) => {
  await page.goto('/inventory/new');
  await expect(page.getByRole('heading', { name: /add product/i })).toBeVisible();
});

When('I create a product with a unique SKU and valid details', async ({ page }) => {
  const sku = uniqueSku();
  await fillField(page, /name/i, `E2E Product ${sku}`);
  await fillField(page, /sku/i, sku);
  // Category is a MUI select — open and pick the first option.
  const category = page.getByLabel(/category/i).first();
  await category.click();
  await page.getByRole('option').first().click();
  await fillField(page, /current stock/i, '25');
  await fillField(page, /reorder level/i, '10');
  await fillField(page, /unit price/i, '4.50');
  await page.getByRole('button', { name: /create product/i }).click();
});

When('I try to create a product using an existing SKU', async ({ page }) => {
  // BEV-0001 is a seeded SKU guaranteed to exist.
  await fillField(page, /name/i, 'E2E Duplicate SKU');
  await fillField(page, /sku/i, 'BEV-0001');
  const category = page.getByLabel(/category/i).first();
  await category.click();
  await page.getByRole('option').first().click();
  await fillField(page, /current stock/i, '5');
  await fillField(page, /reorder level/i, '2');
  await fillField(page, /unit price/i, '1.00');
  await page.getByRole('button', { name: /create product/i }).click();
});

When('I try to create a product with a negative unit price', async ({ page }) => {
  const sku = uniqueSku();
  await fillField(page, /name/i, `E2E Negative ${sku}`);
  await fillField(page, /sku/i, sku);
  const category = page.getByLabel(/category/i).first();
  await category.click();
  await page.getByRole('option').first().click();
  await fillField(page, /current stock/i, '5');
  await fillField(page, /reorder level/i, '2');
  await fillField(page, /unit price/i, '-10');
  await page.getByRole('button', { name: /create product/i }).click();
});

Then('I should be taken to the product details page', async ({ page }) => {
  await expect(page).toHaveURL(/\/inventory\/\d+$/);
});

Then('the product details should show the stock status', async ({ page }) => {
  await expect(page.getByText(/in stock|low stock|out of stock/i).first()).toBeVisible();
});

Then('I should see a duplicate-SKU error', async ({ page }) => {
  await expect(page.getByText(/sku.*(exist|already|unique)|duplicate/i).first()).toBeVisible();
});

Then('I should see a validation error on the form', async ({ page }) => {
  await expect(page.getByText(/negative|must be|invalid|cannot be/i).first()).toBeVisible();
});

Then('I should remain on the Add Product page', async ({ page }) => {
  await expect(page).toHaveURL(/\/inventory\/new/);
});

// --- Edit / Details ---

When("I open the first product's details", async ({ page }) => {
  await openFirstProductDetails(page);
});

When('I edit the product reorder level to a new value', async ({ page }) => {
  await page.getByRole('link', { name: /edit/i }).or(page.getByRole('button', { name: /edit/i })).first().click();
  await expect(page).toHaveURL(/\/inventory\/\d+\/edit$/);
  const field = page.getByLabel(/reorder level/i).first();
  await field.waitFor({ state: 'visible' });
  await field.fill('7');
  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page).toHaveURL(/\/inventory\/\d+$/);
});

Then('the change should be persisted on the details page', async ({ page }) => {
  await expect(page).toHaveURL(/\/inventory\/\d+$/);
  await expect(page.getByText(/7/).first()).toBeVisible();
});

Then('the details page should show stock, reorder level, unit price and status', async ({ page }) => {
  await expect(page.getByText(/reorder/i).first()).toBeVisible();
  await expect(page.getByText(/price/i).first()).toBeVisible();
  await expect(page.getByText(/in stock|low stock|out of stock/i).first()).toBeVisible();
});

// --- Stock Adjustment ---

When('I record a {string} adjustment of {int} with a reason', async ({ page }, type: string, qty: number) => {
  await page.getByRole('link', { name: /adjust/i }).or(page.getByRole('button', { name: /adjust/i })).first().click();
  await expect(page).toHaveURL(/\/inventory\/\d+\/adjust$/);
  // Adjustment type toggle (Stock In / Stock Out).
  await page.getByRole('button', { name: new RegExp(type, 'i') })
    .or(page.getByRole('radio', { name: new RegExp(type, 'i') })).first().click();
  await fillField(page, /quantity/i, String(qty));
  await fillField(page, /reason/i, 'E2E automated adjustment');
  await page.getByRole('button', { name: /adjust stock|submit|save|record/i }).first().click();
});

When('I record a {string} adjustment larger than current stock', async ({ page }, type: string) => {
  await page.getByRole('link', { name: /adjust/i }).or(page.getByRole('button', { name: /adjust/i })).first().click();
  await expect(page).toHaveURL(/\/inventory\/\d+\/adjust$/);
  await page.getByRole('button', { name: new RegExp(type, 'i') })
    .or(page.getByRole('radio', { name: new RegExp(type, 'i') })).first().click();
  // A very large Stock Out guarantees it exceeds any seeded stock level.
  await fillField(page, /quantity/i, '999999');
  await fillField(page, /reason/i, 'E2E oversell attempt');
  await page.getByRole('button', { name: /adjust stock|submit|save|record/i }).first().click();
});

When('I open the adjustment history', async ({ page }) => {
  // After a successful adjustment we are back on details; open the history view.
  await page.getByRole('link', { name: /history/i }).or(page.getByRole('button', { name: /history/i })).first().click();
  await expect(page).toHaveURL(/\/inventory\/\d+\/history$/);
});

Then('the adjustment should succeed', async ({ page }) => {
  // On success the app returns to the product details page (URL without /adjust).
  await expect(page).toHaveURL(/\/inventory\/\d+$/);
});

Then('I should see a negative-stock error', async ({ page }) => {
  await expect(page.getByText(/negative|not enough|insufficient|cannot/i).first()).toBeVisible();
});

Then('I should see at least one adjustment entry', async ({ page }) => {
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
});
