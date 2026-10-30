/**
 * deriveStockStatus bands (BL-9, FR-43/44/45). The single source of truth shared across units.
 */
import { deriveStockStatus, StockStatus } from '@smartstock/shared';

describe('deriveStockStatus (BL-9)', () => {
  it('returns OUT_OF_STOCK when currentStock is exactly 0', () => {
    expect(deriveStockStatus(0, 10)).toBe(StockStatus.OUT_OF_STOCK);
    // Even when reorderLevel is 0, zero stock is OUT_OF_STOCK.
    expect(deriveStockStatus(0, 0)).toBe(StockStatus.OUT_OF_STOCK);
  });

  it('returns LOW_STOCK when 0 < currentStock <= reorderLevel', () => {
    expect(deriveStockStatus(1, 10)).toBe(StockStatus.LOW_STOCK);
    // Boundary: currentStock === reorderLevel is LOW_STOCK.
    expect(deriveStockStatus(10, 10)).toBe(StockStatus.LOW_STOCK);
  });

  it('returns IN_STOCK when currentStock > reorderLevel', () => {
    // Boundary: one above the reorder level flips to IN_STOCK.
    expect(deriveStockStatus(11, 10)).toBe(StockStatus.IN_STOCK);
    expect(deriveStockStatus(1, 0)).toBe(StockStatus.IN_STOCK);
    expect(deriveStockStatus(1000, 10)).toBe(StockStatus.IN_STOCK);
  });
});
