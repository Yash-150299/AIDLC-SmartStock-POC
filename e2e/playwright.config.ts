import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * E2E configuration for the live SmartStock app.
 * - Gherkin .feature files under ./features are compiled to Playwright tests by playwright-bdd.
 * - Step definitions live under ./steps.
 * - Results are emitted for Allure (allure-playwright) into ./allure-results.
 */
const testDir = defineBddConfig({
  features: ['features/**/*.feature'],
  steps: ['steps/**/*.ts', 'fixtures/**/*.ts'],
});

const BASE_URL = process.env.BASE_URL ?? 'https://aidlc-smartstock-poc.vercel.app';

export default defineConfig({
  testDir,
  // The live backend is on Render's free tier and may cold-start (~30-60s), so be generous.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results', detail: true }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
