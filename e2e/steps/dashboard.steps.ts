import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/fixtures';

Then('I should see the summary card {string}', async ({ page }, label: string) => {
  await expect(page.getByText(label, { exact: true })).toBeVisible();
});

Then('the inventory overview table should show at most 10 rows', async ({ page }) => {
  // The overview is the first table on the dashboard; count its body rows.
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(10);
});

Then('I should see the pagination summary text', async ({ page }) => {
  // PaginationControls renders "Showing X–Y of N".
  await expect(page.getByText(/Showing\s+\d+.*of\s+\d+/i)).toBeVisible();
});

When('I click the Refresh button', async ({ page }) => {
  await page.getByRole('button', { name: /refresh/i }).click();
});
