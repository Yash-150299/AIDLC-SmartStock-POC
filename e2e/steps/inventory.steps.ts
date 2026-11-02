import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/fixtures';

When('I click the {string} summary card', async ({ page }, label: string) => {
  // Each clickable card is a link (MUI CardActionArea) whose accessible name starts with the label.
  const card = page.getByRole('link', { name: new RegExp(label, 'i') });
  await card.first().click();
});

Then('I should be on the inventory page', async ({ page }) => {
  await expect(page).toHaveURL(/\/inventory/);
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
});

Then('the stock status filter should be set to {string}', async ({ page }, expected: string) => {
  // The Status filter is a MUI select; its rendered value shows the chosen label.
  const statusField = page.getByLabel('Status');
  await expect(statusField).toContainText(new RegExp(expected, 'i'));
});

Then('I should see the {string} action', async ({ page }, label: string) => {
  await expect(page.getByRole('link', { name: new RegExp(label, 'i') })
    .or(page.getByRole('button', { name: new RegExp(label, 'i') })).first()).toBeVisible();
});
