/**
 * zod schemas for the stock-adjustment module (BR-5/BR-8). Quantity must be a positive integer;
 * reason non-blank; type a valid AdjustmentType.
 */
import { z } from 'zod';
import { ADJUSTMENT_TYPE_VALUES } from '@smartstock/shared';

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const stockAdjustmentBodySchema = z.object({
  type: z.enum(ADJUSTMENT_TYPE_VALUES as [string, ...string[]]),
  quantity: z
    .number()
    .int('Quantity must be a whole number greater than zero.')
    .positive('Quantity must be a whole number greater than zero.'),
  reason: z.string().trim().min(1, 'Reason is required.'),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().optional(),
  pageSize: z.coerce.number().int().optional(),
});
