/**
 * Shared enums / unions — owning unit: shared (shared-contracts.md).
 * These are the single source of truth imported by backend, web, and mobile.
 */

/** Derived stock status band (BL-9, FR-43/44/45). Never persisted. */
export const StockStatus = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;
export type StockStatus = (typeof StockStatus)[keyof typeof StockStatus];

/** Direction of a stock adjustment (FR-29). The sign is carried by the type, not the quantity. */
export const AdjustmentType = {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
} as const;
export type AdjustmentType = (typeof AdjustmentType)[keyof typeof AdjustmentType];

/** Allowed product sort fields (FR-17). */
export const SortField = {
  name: 'name',
  stock: 'stock',
  price: 'price',
} as const;
export type SortField = (typeof SortField)[keyof typeof SortField];

/** Sort direction. */
export const SortDirection = {
  asc: 'asc',
  desc: 'desc',
} as const;
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export const STOCK_STATUS_VALUES: StockStatus[] = Object.values(StockStatus);
export const ADJUSTMENT_TYPE_VALUES: AdjustmentType[] = Object.values(AdjustmentType);
export const SORT_FIELD_VALUES: SortField[] = Object.values(SortField);
export const SORT_DIRECTION_VALUES: SortDirection[] = Object.values(SortDirection);
