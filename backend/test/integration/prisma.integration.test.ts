/**
 * DEFERRED Prisma integration tier (Q2=C). These tests exercise the REAL database behaviour that
 * the repository-mocked tier cannot: the unique-SKU constraint, genuine transaction rollback (no
 * partial write), and the raw low-stock SQL predicate.
 *
 * They are SKIPPED unless a real Postgres is reachable via `DATABASE_URL`. The runnable suite here
 * sets a placeholder DATABASE_URL (see test/_helpers/env.ts) purely to satisfy the config loader,
 * so this suite is skipped-and-documented and never fails the build. Infrastructure (a docker test
 * database) is owned by the deploy agent; wire these up in the post-all-units integration pass.
 *
 * To run locally: point DATABASE_URL at a migrated test DB and set RUN_DB_INTEGRATION=1.
 */

const dbIntegrationEnabled =
  process.env.RUN_DB_INTEGRATION === '1' &&
  typeof process.env.DATABASE_URL === 'string' &&
  !process.env.DATABASE_URL.includes('smartstock_test'); // placeholder marker from env.ts

const describeOrSkip = dbIntegrationEnabled ? describe : describe.skip;

describeOrSkip('Prisma integration (requires a real migrated Postgres)', () => {
  it.todo('rejects a duplicate SKU via the unique constraint (BL-7, DB-1)');
  it.todo('rolls the whole transaction back on NegativeStock — product stock unchanged (FR-47, NFR-6)');
  it.todo('counts low-stock rows with the raw BR-7 predicate (currentStock > 0 AND <= reorderLevel)');
  it.todo('denylist upsert is idempotent for a duplicate jti (BR-14)');
});

// A single always-present assertion so the file is a valid, non-empty Jest suite even when skipped.
describe('Prisma integration tier — availability note', () => {
  it('is deferred unless a real DB is configured (documented, not a failure)', () => {
    expect(typeof dbIntegrationEnabled).toBe('boolean');
  });
});
