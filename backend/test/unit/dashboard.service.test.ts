/**
 * DashboardService (BL-4, FR-13). Repository mocked; the service aggregates four live metrics.
 */
jest.mock('../../src/modules/dashboard/dashboard.repository', () => ({
  dashboardRepository: {
    totalProducts: jest.fn(),
    totalStockUnits: jest.fn(),
    lowStockItems: jest.fn(),
    outOfStockItems: jest.fn(),
  },
}));

import { dashboardService } from '../../src/modules/dashboard/dashboard.service';
import { dashboardRepository } from '../../src/modules/dashboard/dashboard.repository';

const repo = dashboardRepository as jest.Mocked<typeof dashboardRepository>;

describe('dashboardService.getStats (BL-4)', () => {
  it('combines the four repository metrics into one DashboardStats', async () => {
    repo.totalProducts.mockResolvedValue(12);
    repo.totalStockUnits.mockResolvedValue(340);
    repo.lowStockItems.mockResolvedValue(3);
    repo.outOfStockItems.mockResolvedValue(1);

    const stats = await dashboardService.getStats();
    expect(stats).toEqual({
      totalProducts: 12,
      totalStockUnits: 340,
      lowStockItems: 3,
      outOfStockItems: 1,
    });
  });

  it('returns all zeros when there are no products', async () => {
    repo.totalProducts.mockResolvedValue(0);
    repo.totalStockUnits.mockResolvedValue(0);
    repo.lowStockItems.mockResolvedValue(0);
    repo.outOfStockItems.mockResolvedValue(0);

    const stats = await dashboardService.getStats();
    expect(stats).toEqual({ totalProducts: 0, totalStockUnits: 0, lowStockItems: 0, outOfStockItems: 0 });
  });
});
