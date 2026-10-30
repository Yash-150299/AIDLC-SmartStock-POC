/**
 * Jest + ts-jest config for the SmartStock backend unit test suite.
 *
 * - ts-jest transforms TypeScript in CommonJS mode (matches tsconfig.base.json `module: CommonJS`).
 * - `@smartstock/shared` is mapped to the shared SOURCE so tests run without pre-building the
 *   shared package (dist may not exist). The barrel re-exports everything the backend imports.
 * - setupFiles loads a deterministic test environment (JWT_SECRET, DATABASE_URL) BEFORE any
 *   module that calls loadConfig() is imported.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/shared/test', '<rootDir>/backend/test'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@smartstock/shared$': '<rootDir>/shared/src/index.ts',
  },
  setupFiles: ['<rootDir>/backend/test/_helpers/env.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        // The app sources use strict TS already; isolatedModules keeps transforms fast and avoids
        // cross-file type errors from the test tsconfig leaking into runtime.
        isolatedModules: true,
      },
    ],
  },
  clearMocks: true,
  collectCoverageFrom: [
    'shared/src/**/*.ts',
    '!shared/src/index.ts',
    'backend/src/middleware/**/*.ts',
    'backend/src/errors/**/*.ts',
    'backend/src/config/env.ts',
    'backend/src/modules/**/*.service.ts',
    'backend/src/modules/auth/token.ts',
    'backend/src/modules/inventory/inventory.mapper.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'json-summary'],
};
