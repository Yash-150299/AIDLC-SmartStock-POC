/**
 * InventoryRepository — the only inventory code that calls Prisma (BL-5..BL-8, BL-12).
 * Stock-status filtering uses the exact SQL image of deriveStockStatus (BR-7).
 */
import type { Prisma, Product, Category } from '@prisma/client';
import { StockStatus, type SortField, type SortDirection } from '@smartstock/shared';
import { prisma, type TransactionClient } from '../../persistence/prisma';

export type ProductWithCategory = Product & { category: Category };

export interface ListFilters {
  search?: string;
  categoryId?: number;
  stockStatus?: StockStatus;
  sortBy: SortField;
  sortDir: SortDirection;
  skip: number;
  take: number;
}

/** Build the Prisma where-clause from search + filters (BR-7/BR-13). */
function buildWhere(filters: ListFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.search) {
    and.push({
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  if (filters.categoryId) {
    and.push({ categoryId: filters.categoryId });
  }

  if (filters.stockStatus === StockStatus.OUT_OF_STOCK) {
    and.push({ currentStock: 0 });
  } else if (filters.stockStatus === StockStatus.LOW_STOCK) {
    // 0 < currentStock <= reorderLevel — Prisma can't compare two columns directly, so use raw.
    and.push({ currentStock: { gt: 0 } });
    and.push({ currentStock: { lte: prisma.product.fields.reorderLevel } });
  } else if (filters.stockStatus === StockStatus.IN_STOCK) {
    and.push({ currentStock: { gt: prisma.product.fields.reorderLevel } });
  }

  if (and.length > 0) {
    where.AND = and;
  }
  return where;
}

function buildOrderBy(sortBy: SortField, sortDir: SortDirection): Prisma.ProductOrderByWithRelationInput {
  const column = sortBy === 'stock' ? 'currentStock' : sortBy === 'price' ? 'unitPrice' : 'name';
  return { [column]: sortDir } as Prisma.ProductOrderByWithRelationInput;
}

export const inventoryRepository = {
  async listProducts(filters: ListFilters): Promise<{ items: ProductWithCategory[]; total: number }> {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: buildOrderBy(filters.sortBy, filters.sortDir),
        skip: filters.skip,
        take: filters.take,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total };
  },

  findById(id: number, client: TransactionClient | typeof prisma = prisma): Promise<ProductWithCategory | null> {
    return client.product.findUnique({ where: { id }, include: { category: true } });
  },

  findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { sku } });
  },

  categoryExists(id: number): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  },

  /** Case-insensitive lookup so "Dairy" and "dairy" are treated as the same category. */
  findCategoryByName(name: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  },

  createCategory(name: string): Promise<Category> {
    return prisma.category.create({ data: { name } });
  },

  create(data: Prisma.ProductCreateInput): Promise<ProductWithCategory> {
    return prisma.product.create({ data, include: { category: true } });
  },

  update(id: number, data: Prisma.ProductUpdateInput): Promise<ProductWithCategory> {
    return prisma.product.update({ where: { id }, data, include: { category: true } });
  },

  listCategories(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },
};
