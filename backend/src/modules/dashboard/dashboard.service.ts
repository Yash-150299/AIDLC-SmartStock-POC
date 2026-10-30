/**
 * DashboardService (BL-4, FR-13). Four live metrics computed on every call; zero products -> all 0.
 */
import type { DashboardStats } from '@smartstock/shared';
import { dashboardRepository } from './dashboard.repository';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [totalProducts, totalStockUnits, lowStockItems, outOfStockItems] = await Promise.all([
      dashboardRepository.totalProducts(),
      dashboardRepository.totalStockUnits(),
      dashboardRepository.lowStockItems(),
      dashboardRepository.outOfStockItems(),
    ]);
    return { totalProducts, totalStockUnits, lowStockItems, outOfStockItems };
  },
};
