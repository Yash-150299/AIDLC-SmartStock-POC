import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/fixtures';

When('I open the Add Category dialog', async ({ page }) => {
  await page.getByRole('button', { name: /add category/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

When('I submit a new category with a unique name', async ({ page }) => {
  const unique = `E2E Cat ${Date.now()}`;
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/category name/i).fill(unique);
  await dialog.getByRole('button', { name: /^add category$/i }).click();
});

When('I submit the category with a blank name', async ({ page }) => {
  const dialog = page.getByRole('dialog');
  // Leave the field blank (type a space then clear) and attempt submit.
  const field = dialog.getByLabel(/category name/i);
  await field.fill(' ');
  await field.fill('');
  await dialog.getByRole('button', { name: /^add category$/i }).click();
});

Then('I should see the category-added confirmation', async ({ page }) => {
  // Success snackbar: Category "..." added.
  await expect(page.getByText(/added/i).first()).toBeVisible();
});

Then('I should see a category name validation error', async ({ page }) => {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(/required/i).first()).toBeVisible();
});
