import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures/fixtures';

/** Reusable login routine: fills the SmartStock login form and submits. */
async function doLogin(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login');
  const user = page.locator('input[autocomplete="username"]');
  await user.waitFor({ state: 'visible' });
  await user.fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
}

Given('I am on the login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
});

Given('I am logged in as {string}', async ({ page }, username: string) => {
  await doLogin(page, username, 'Password123!');
  // The app routes to /dashboard and renders the "Dashboard" heading on success.
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

When('I log in with username {string} and password {string}', async ({ page }, username: string, password: string) => {
  await doLogin(page, username, password);
});

When('I navigate directly to the inventory page', async ({ page }) => {
  await page.goto('/inventory');
});

Then('I should land on the dashboard', async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

Then('I should see the signed-in user {string}', async ({ page }, username: string) => {
  await expect(page.getByText(username, { exact: true })).toBeVisible();
});

Then('I should see an invalid-credentials error', async ({ page }) => {
  // The login form surfaces INVALID_CREDENTIALS as an inline/form error message.
  await expect(
    page.getByText(/incorrect|invalid|username\/email or password/i).first(),
  ).toBeVisible();
});

Then('I should remain on the login page', async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
});

When('I click the Logout button', async ({ page }) => {
  await page.getByRole('button', { name: /logout/i }).click();
});

Then('I should see a logout confirmation dialog', async ({ page }) => {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Scope to the dialog title heading to avoid matching both the title and the body text.
  await expect(dialog.getByRole('heading', { name: /log out\?/i })).toBeVisible();
  await expect(dialog.getByText(/are you sure you want to log out/i)).toBeVisible();
});

When('I confirm the logout', async ({ page }) => {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /^log out$/i }).click();
});

Then('I should be back on the login page', async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});
