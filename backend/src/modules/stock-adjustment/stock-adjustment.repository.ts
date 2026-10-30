/**
 * StockAdjustmentRepository (DB-2, BL-10/BL-11). Transaction-aware product read/update and the
 * insert-only ledger write, plus paginated newest-first history.
 */
import type { AdjustmentType, InventoryTransaction, Product } from '@prisma/client';
import { prisma, type TransactionClient } from '../../persistence/prisma';

export const stockAdjustmentRepository = {
  /** Fresh in-transaction read of a product's stock (BL-10 step 2b). */
  findProductForUpdate(tx: TransactionClient, productId: number): Promise<Product | null> {
    return tx.product.findUnique({ where: { id: productId } });
  },

  updateStock(tx: TransactionClient, productId: number, newStock: number, lastUpdated: Date): Promise<Product> {
    return tx.product.update({
      where: { id: productId },
      data: { currentStock: newStock, lastUpdated },
    });
  },

  insertTransaction(
    tx: TransactionClient,
    data: {
      productId: number;
      type: AdjustmentType;
      quantity: number;
      reason: string;
      resultingStock: number;
      createdBy?: number;
    },
  ): Promise<InventoryTransaction> {
    return tx.inventoryTransaction.create({
      data: {
        product: { connect: { id: data.productId } },
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        resultingStock: data.resultingStock,
        ...(data.createdBy ? { user: { connect: { id: data.createdBy } } } : {}),
      },
    });
  },

  productExists(productId: number): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id: productId } });
  },

  async history(
    productId: number,
    skip: number,
    take: number,
  ): Promise<{ items: InventoryTransaction[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.inventoryTransaction.count({ where: { productId } }),
    ]);
    return { items, total };
  },
};
