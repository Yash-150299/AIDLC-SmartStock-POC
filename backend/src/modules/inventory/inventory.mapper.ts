/**
 * Mappers: Prisma rows -> shared DTOs. The derived stockStatus comes from the canonical shared
 * rule (BL-9), so list/details/create/update/adjust all agree.
 */
import type { Category } from '@prisma/client';
import { deriveStockStatus, type CategoryDto, type ProductDto } from '@smartstock/shared';
import type { ProductWithCategory } from './inventory.repository';

export function toProductDto(product: ProductWithCategory): ProductDto {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    currentStock: product.currentStock,
    reorderLevel: product.reorderLevel,
    unitPrice: Number(product.unitPrice),
    ...(product.description != null ? { description: product.description } : {}),
    stockStatus: deriveStockStatus(product.currentStock, product.reorderLevel),
    lastUpdated: product.lastUpdated.toISOString(),
  };
}

export function toCategoryDto(category: Category): CategoryDto {
  return { id: category.id, name: category.name };
}
