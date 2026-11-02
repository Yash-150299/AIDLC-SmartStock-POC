import { test as base, createBdd } from 'playwright-bdd';

/**
 * Shared BDD test fixtures. We expose the standard Playwright `page` through playwright-bdd's
 * `createBdd`, giving us Given/When/Then binders used by the step files.
 */
export const test = base;
export const { Given, When, Then } = createBdd(test);
