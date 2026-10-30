/**
 * HTTP contract for stock-adjustment routes (/api/products/:id/stock-adjustments). Real middleware
 * + auth; withTransaction + both repositories mocked. Verifies real status codes incl. 400-before-422.
 */
jest.mock('../../src/modules/auth/auth.repository', () => ({
  authRepository: {
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    denylistToken: jest.fn(),
    isDenylisted: jest.fn(),
    purgeExpired: jest.fn(),
  },
}));
jest.mock('../../src/persistence/prisma', () => ({ withTransaction: jest.fn() }));
jest.mock('../../src/modules/stock-adjustment/stock-adjustment.repository', () => ({
  stockAdjustmentRepository: {
    findProductForUpdate: jest.fn(),
    updateStock: jest.fn(),
    insertTransaction: jest.fn(),
    productExists: jest.fn(),
    history: jest.fn(),
  },
}));
jest.mock('../../src/modules/inventory/inventory.repository', () => ({
  inventoryRepository: { findById: jest.fn() },
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { authRepository } from '../../src/modules/auth/auth.repository';
import { stockAdjustmentRepository } from '../../src/modules/stock-adjustment/stock-adjustment.repository';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository';
import { withTransaction } from '../../src/persistence/prisma';
import { bearerToken, wireAuthedUser } from '../_helpers/auth';
import { makeProductRow, makeTxnRow } from '../_helpers/fixtures';

const authRepo = authRepository as jest.Mocked<typeof authRepository>;
const saRepo = stockAdjustmentRepository as jest.Mocked<typeof stockAdjustmentRepository>;
const invRepo = inventoryRepository as jest.Mocked<typeof inventoryRepository>;
const withTx = withTransaction as jest.Mock;
const app = createApp();

beforeEach(() => {
  wireAuthedUser(authRepo);
  withTx.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn({}));
});

const base = '/api/products/1/stock-adjustments';

describe('auth guard', () => {
  it('401 without a bearer token', async () => {
    const res = await request(app).post(base).send({ type: 'STOCK_IN', quantity: 1, reason: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/products/:id/stock-adjustments', () => {
  it('201 on a successful STOCK_IN', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 50 }) as never);
    saRepo.updateStock.mockResolvedValue({} as never);
    saRepo.insertTransaction.mockResolvedValue({} as never);
    invRepo.findById.mockResolvedValue(makeProductRow({ currentStock: 55 }) as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow({ resultingStock: 55 })], total: 1 } as never);

    const res = await request(app)
      .post(base)
      .set('Authorization', bearerToken())
      .send({ type: 'STOCK_IN', quantity: 5, reason: 'Restock' });
    expect(res.status).toBe(201);
    expect(res.body.product.currentStock).toBe(55);
    expect(res.body.adjustment.resultingStock).toBe(55);
  });

  it('400 VALIDATION_ERROR for a non-positive quantity (schema) — before any 422', async () => {
    const res = await request(app)
      .post(base)
      .set('Authorization', bearerToken())
      .send({ type: 'STOCK_OUT', quantity: 0, reason: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(saRepo.findProductForUpdate).not.toHaveBeenCalled();
  });

  it('404 NOT_FOUND when the product does not exist', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(null);
    const res = await request(app)
      .post(base)
      .set('Authorization', bearerToken())
      .send({ type: 'STOCK_IN', quantity: 1, reason: 'x' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('422 NEGATIVE_STOCK when the adjustment would go below zero (and no write occurs)', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 2 }) as never);
    const res = await request(app)
      .post(base)
      .set('Authorization', bearerToken())
      .send({ type: 'STOCK_OUT', quantity: 5, reason: 'Oversell' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('NEGATIVE_STOCK');
    expect(saRepo.updateStock).not.toHaveBeenCalled();
    expect(saRepo.insertTransaction).not.toHaveBeenCalled();
  });
});

describe('GET /api/products/:id/stock-adjustments', () => {
  it('200 with newest-first history', async () => {
    saRepo.productExists.mockResolvedValue(makeProductRow() as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow(), makeTxnRow({ id: 2 })], total: 2 } as never);
    const res = await request(app).get(base).set('Authorization', bearerToken());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].id).toBe(1);
  });

  it('404 when the product is absent', async () => {
    saRepo.productExists.mockResolvedValue(null);
    const res = await request(app).get(base).set('Authorization', bearerToken());
    expect(res.status).toBe(404);
  });
});
