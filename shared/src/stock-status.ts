/**
 * Canonical stock-status derivation (BL-9, FR-43/44/45) — the single source of truth shared by
 * backend, web, and mobile so displayed status can never drift from the stored quantities.
 */
import { StockStatus } from './enums';

/**
 * Derive stock status from the current quantity and reorder level.
 * - currentStock === 0                               -> OUT_OF_STOCK
 * - 0 < currentStock && currentStock <= reorderLevel -> LOW_STOCK
 * - currentStock > reorderLevel                      -> IN_STOCK
 */
export function deriveStockStatus(currentStock: number, reorderLevel: number): StockStatus {
  if (currentStock === 0) {
    return StockStatus.OUT_OF_STOCK;
  }
  if (currentStock <= reorderLevel) {
    return StockStatus.LOW_STOCK;
  }
  return StockStatus.IN_STOCK;
}
