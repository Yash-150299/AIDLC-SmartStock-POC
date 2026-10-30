/**
 * StockAdjustmentService (BL-10/BL-11). The one genuinely transactional flow:
 * validate shape outside the tx (400 before 422, BR-10), then ONE tx that re-reads stock fresh,
 * computes the new value, aborts on negative (422), else updates stock + inserts the ledger row +
 * bumps lastUpdated, and commits together (FR-46/47, NFR-6).
 */
import type { InventoryTransaction } from '@prisma/client';
import {
  AdjustmentType,
  ADJUSTMENT_TYPE_VALUES,
  isNonBlank,
  isPositiveInteger,
  normalizePagination,
  type Paginated,
  type StockAdjustmentDto,
  type StockAdjustmentRequest,
  type StockAdjustmentResult,
} from '@smartstock/shared';
import { NegativeStockError, NotFoundError, ValidationError } from '../../errors/app-errors';
import { withTransaction } from '../../persistence/prisma';
import { inventoryRepository } from '../inventory/inventory.repository';
import { toProductDto } from '../inventory/inventory.mapper';
import { stockAdjustmentRepository } from './stock-adjustment.repository';

function toAdjustmentDto(row: InventoryTransaction): StockAdjustmentDto {
  return {
    id: row.id,
    productId: row.productId,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    resultingStock: row.resultingStock,
    createdAt: row.createdAt.toISOString(),
  };
}

export const stockAdjustmentService = {
  /** BL-10: atomic stock adjustment. */
  async adjustStock(
    productId: number,
    request: StockAdjustmentRequest,
    userId?: number,
  ): Promise<StockAdjustmentResult> {
    // Step 1 — validate shape OUTSIDE the transaction (BR-5/BR-8, 400 before 422 — BR-10).
    if (!ADJUSTMENT_TYPE_VALUES.includes(request.type)) {
      throw new ValidationError('Please check the highlighted fields and try again.', {
        type: ['Type must be STOCK_IN or STOCK_OUT.'],
      });
    }
    if (!isPositiveInteger(request.quantity)) {
      throw new ValidationError('Quantity must be a whole number greater than zero.', {
        quantity: ['Quantity must be a whole number greater than zero.'],
      });
    }
    if (!isNonBlank(request.reason)) {
      throw new ValidationError('Please check the highlighted fields and try again.', {
        reason: ['Reason is required.'],
      });
    }

    // Step 2 — ONE transaction.
    const now = new Date();
    await withTransaction(async (tx) => {
      const product = await stockAdjustmentRepository.findProductForUpdate(tx, productId);
      if (!product) {
        throw new NotFoundError('That product could not be found.'); // rolls back (no changes)
      }

      const delta = request.type === AdjustmentType.STOCK_IN ? request.quantity : -request.quantity;
      const newStock = product.currentStock + delta;
      if (newStock < 0) {
        throw new NegativeStockError(); // 422, inventory unchanged (BR-9)
      }

      await stockAdjustmentRepository.updateStock(tx, productId, newStock, now);
      await stockAdjustmentRepository.insertTransaction(tx, {
        productId,
        type: request.type,
        quantity: request.quantity,
        reason: request.reason,
        resultingStock: newStock,
        ...(userId ? { createdBy: userId } : {}),
      });
    });

    // Step 3 — read the committed state for the response (fresh product + latest adjustment).
    const product = await inventoryRepository.findById(productId);
    if (!product) {
      // Should not happen — the product existed inside the committed transaction.
      throw new NotFoundError('That product could not be found.');
    }
    const { items } = await stockAdjustmentRepository.history(productId, 0, 1);
    const latest = items[0];
    if (!latest) {
      throw new NotFoundError('That adjustment could not be found.');
    }

    return { product: toProductDto(product), adjustment: toAdjustmentDto(latest) };
  },

  /** BL-11: paginated newest-first history (404 if product absent). */
  async getAdjustmentHistory(
    productId: number,
    page?: number,
    pageSize?: number,
  ): Promise<Paginated<StockAdjustmentDto>> {
    const product = await stockAdjustmentRepository.productExists(productId);
    if (!product) {
      throw new NotFoundError('That product could not be found.');
    }

    const normalized = normalizePagination(page, pageSize);
    const { items, total } = await stockAdjustmentRepository.history(
      productId,
      normalized.skip,
      normalized.take,
    );
    return {
      items: items.map(toAdjustmentDto),
      page: normalized.page,
      pageSize: normalized.pageSize,
      total,
    };
  },
};
