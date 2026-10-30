/**
 * StockAdjustmentService (BL-10/BL-11). The one transactional flow. We mock withTransaction (invokes
 * the callback with a fake tx), the stock-adjustment repository, and the inventory repository. This
 * lets us assert the atomic contract — on a negative-stock abort NO write is attempted, and 400
 * (shape) fires BEFORE 422 (business) — all without a real database.
 */
jest.mock('../../src/persistence/prisma', () => ({
  withTransaction: jest.fn(),
}));
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

import { AdjustmentType } from '@smartstock/shared';
import { stockAdjustmentService } from '../../src/modules/stock-adjustment/stock-adjustment.service';
import { stockAdjustmentRepository } from '../../src/modules/stock-adjustment/stock-adjustment.repository';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository';
import { withTransaction } from '../../src/persistence/prisma';
import {
  NegativeStockError,
  NotFoundError,
  ValidationError,
} from '../../src/errors/app-errors';
import { makeProductRow, makeTxnRow } from '../_helpers/fixtures';

const saRepo = stockAdjustmentRepository as jest.Mocked<typeof stockAdjustmentRepository>;
const invRepo = inventoryRepository as jest.Mocked<typeof inventoryRepository>;
const withTx = withTransaction as jest.Mock;

/** Make withTransaction run the callback with a dummy tx object. */
function wireTransaction() {
  const tx = {} as never;
  withTx.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(tx));
  return tx;
}

describe('stockAdjustmentService.adjustStock — validation (400 before tx)', () => {
  beforeEach(() => wireTransaction());

  it('rejects an invalid type with ValidationError and never opens a transaction', async () => {
    await expect(
      stockAdjustmentService.adjustStock(1, { type: 'BOGUS' as never, quantity: 1, reason: 'x' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(withTx).not.toHaveBeenCalled();
  });

  it('rejects a non-positive / non-integer quantity (BR-8)', async () => {
    await expect(
      stockAdjustmentService.adjustStock(1, { type: AdjustmentType.STOCK_IN, quantity: 0, reason: 'x' }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      stockAdjustmentService.adjustStock(1, { type: AdjustmentType.STOCK_IN, quantity: 1.5, reason: 'x' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(withTx).not.toHaveBeenCalled();
  });

  it('rejects a blank reason (BR-5)', async () => {
    await expect(
      stockAdjustmentService.adjustStock(1, { type: AdjustmentType.STOCK_IN, quantity: 1, reason: '  ' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('stockAdjustmentService.adjustStock — transactional flow (BL-10)', () => {
  beforeEach(() => wireTransaction());

  it('STOCK_IN increases stock, writes ledger, and returns product + adjustment', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 50 }) as never);
    saRepo.updateStock.mockResolvedValue({} as never);
    saRepo.insertTransaction.mockResolvedValue({} as never);
    invRepo.findById.mockResolvedValue(makeProductRow({ currentStock: 55 }) as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow({ resultingStock: 55 })], total: 1 } as never);

    const result = await stockAdjustmentService.adjustStock(1, {
      type: AdjustmentType.STOCK_IN,
      quantity: 5,
      reason: 'Restock',
    });

    expect(saRepo.updateStock).toHaveBeenCalledWith(expect.anything(), 1, 55, expect.any(Date));
    expect(saRepo.insertTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ productId: 1, resultingStock: 55, quantity: 5 }),
    );
    expect(result.product.currentStock).toBe(55);
    expect(result.adjustment.resultingStock).toBe(55);
  });

  it('STOCK_OUT decreases stock when sufficient', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 10 }) as never);
    saRepo.updateStock.mockResolvedValue({} as never);
    saRepo.insertTransaction.mockResolvedValue({} as never);
    invRepo.findById.mockResolvedValue(makeProductRow({ currentStock: 7 }) as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow({ type: 'STOCK_OUT', resultingStock: 7 })], total: 1 } as never);

    await stockAdjustmentService.adjustStock(1, {
      type: AdjustmentType.STOCK_OUT,
      quantity: 3,
      reason: 'Sold',
    });
    expect(saRepo.updateStock).toHaveBeenCalledWith(expect.anything(), 1, 7, expect.any(Date));
  });

  it('allows STOCK_OUT down to exactly zero (boundary)', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 3 }) as never);
    saRepo.updateStock.mockResolvedValue({} as never);
    saRepo.insertTransaction.mockResolvedValue({} as never);
    invRepo.findById.mockResolvedValue(makeProductRow({ currentStock: 0 }) as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow({ resultingStock: 0 })], total: 1 } as never);

    const result = await stockAdjustmentService.adjustStock(1, {
      type: AdjustmentType.STOCK_OUT,
      quantity: 3,
      reason: 'Sold out',
    });
    expect(result.product.currentStock).toBe(0);
  });

  it('aborts with NegativeStockError (422) and writes NOTHING when stock would go negative (BR-9, NFR-6)', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 2 }) as never);
    await expect(
      stockAdjustmentService.adjustStock(1, {
        type: AdjustmentType.STOCK_OUT,
        quantity: 5,
        reason: 'Oversell',
      }),
    ).rejects.toBeInstanceOf(NegativeStockError);
    // The "no partial write" contract — neither the stock update nor the ledger insert ran.
    expect(saRepo.updateStock).not.toHaveBeenCalled();
    expect(saRepo.insertTransaction).not.toHaveBeenCalled();
  });

  it('throws NotFound (and writes nothing) when the product does not exist inside the tx', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(null);
    await expect(
      stockAdjustmentService.adjustStock(999, {
        type: AdjustmentType.STOCK_IN,
        quantity: 1,
        reason: 'x',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(saRepo.updateStock).not.toHaveBeenCalled();
  });

  it('passes userId through to the ledger insert when provided', async () => {
    saRepo.findProductForUpdate.mockResolvedValue(makeProductRow({ currentStock: 50 }) as never);
    saRepo.updateStock.mockResolvedValue({} as never);
    saRepo.insertTransaction.mockResolvedValue({} as never);
    invRepo.findById.mockResolvedValue(makeProductRow({ currentStock: 51 }) as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow()], total: 1 } as never);

    await stockAdjustmentService.adjustStock(
      1,
      { type: AdjustmentType.STOCK_IN, quantity: 1, reason: 'x' },
      9,
    );
    expect(saRepo.insertTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ createdBy: 9 }),
    );
  });
});

describe('stockAdjustmentService.getAdjustmentHistory (BL-11)', () => {
  it('throws NotFound when the product is absent', async () => {
    saRepo.productExists.mockResolvedValue(null);
    await expect(stockAdjustmentService.getAdjustmentHistory(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns paginated newest-first history mapped to DTOs', async () => {
    saRepo.productExists.mockResolvedValue(makeProductRow() as never);
    saRepo.history.mockResolvedValue({ items: [makeTxnRow(), makeTxnRow({ id: 2 })], total: 2 } as never);

    const result = await stockAdjustmentService.getAdjustmentHistory(1, 1, 20);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.id).toBe(1);
    expect(typeof result.items[0]!.createdAt).toBe('string'); // ISO string
    expect(saRepo.history).toHaveBeenCalledWith(1, 0, 20);
  });
});
