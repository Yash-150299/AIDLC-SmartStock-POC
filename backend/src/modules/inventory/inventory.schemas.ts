/**
 * zod schemas for the inventory module (Q5=A, BL-5/BL-7/BL-8). Query params are coerced from
 * strings; the UpdateProductRequest intentionally has no `sku` field (BR-6).
 */
import { z } from 'zod';
import { SORT_DIRECTION_VALUES, SORT_FIELD_VALUES, STOCK_STATUS_VALUES } from '@smartstock/shared';

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.coerce.number().int().positive().optional(),
  stockStatus: z.enum(STOCK_STATUS_VALUES as [string, ...string[]]).optional(),
  sortBy: z.enum(SORT_FIELD_VALUES as [string, ...string[]]).optional(),
  sortDir: z.enum(SORT_DIRECTION_VALUES as [string, ...string[]]).optional(),
  page: z.coerce.number().int().optional(),
  pageSize: z.coerce.number().int().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required.'),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  sku: z.string().trim().min(1, 'SKU is required.'),
  categoryId: z.number().int('Category is required.').positive('Category is required.'),
  currentStock: z.number().int('Current stock must be a whole number.').min(0, 'Current stock cannot be negative.'),
  reorderLevel: z.number().int('Reorder level must be a whole number.').min(0, 'Reorder level cannot be negative.'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative.'),
  description: z.string().optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be blank.').optional(),
    categoryId: z.number().int().positive().optional(),
    currentStock: z.number().int().min(0, 'Current stock cannot be negative.').optional(),
    reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative.').optional(),
    unitPrice: z.number().min(0, 'Unit price cannot be negative.').optional(),
    description: z.string().optional(),
  })
  .strict();
