/**
 * React Query query for `GET /dashboard/stats`. Drives the summary cards and the manual
 * Refresh action (BL-W3). All values are server-provided (FR-13); nothing is computed locally.
 */
import { useQuery } from '@tanstack/react-query';
import type { DashboardStats } from '@smartstock/shared';
import { getDashboardStats } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => getDashboardStats(),
  });
}
