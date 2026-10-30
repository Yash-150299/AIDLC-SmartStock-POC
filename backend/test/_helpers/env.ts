/**
 * Deterministic test environment. Loaded via jest `setupFiles` BEFORE any module that calls
 * loadConfig() (token.ts / env.ts) is imported, so JWT signing/verification has a stable secret and
 * the config loader's `required()` checks pass without a real database.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-do-not-use-in-prod';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '8h';
// A syntactically-valid placeholder. No real DB is contacted in the runnable tier (repositories
// and withTransaction are mocked); this only satisfies env.ts `required('DATABASE_URL')`.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/smartstock_test';
process.env.PORT = process.env.PORT ?? '3000';
