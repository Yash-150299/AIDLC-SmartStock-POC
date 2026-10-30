/**
 * DashboardRepository (BL-4). Aggregate reads computed live from persisted data. Low/out counts
 * use the exact BR-7 predicates so they can never contradict a product's derived status.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../persistence/prisma';

interface CountRow {
  count: bigint;
}

export const dashboardRepository = {
  totalProducts(): Promise<number> {
    return prisma.product.count();
  },

  async totalStockUnits(): Promise<number> {
    const result = await prisma.product.aggregate({ _sum: { currentStock: true } });
    return result._sum.currentStock ?? 0;
  },

  /** LOW_STOCK: currentStock > 0 AND currentStock <= reorderLevel (BR-7). */
  async lowStockItems(): Promise<number> {
    const rows = await prisma.$queryRaw<CountRow[]>(
      Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "products" WHERE "current_stock" > 0 AND "current_stock" <= "reorder_level"`,
    );
    return Number(rows[0]?.count ?? 0n);
  },

  /** OUT_OF_STOCK: currentStock = 0 (BR-7). */
  outOfStockItems(): Promise<number> {
    return prisma.product.count({ where: { currentStock: 0 } });
  },
};
