/**
 * Query for `GET /products/:id/stock-adjustments` — paged, newest first (BL-W8).
 */
import { useQuery } from '@tanstack/react-query';
import { normalizePagination, type Paginated, type StockAdjustmentDto } from '@smartstock/shared';
import { listStockAdjustments } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useAdjustmentHistory(productId: string | undefined, page: number, pageSize = 20) {
  const normalized = normalizePagination(page, pageSize);
  const query = { page: normalized.page, pageSize: normalized.pageSize };

  return useQuery<Paginated<StockAdjustmentDto>>({
    queryKey: productId
      ? queryKeys.adjustmentHistory(productId, query)
      : ['products', 'missing', 'adjustments', query],
    queryFn: () => listStockAdjustments(productId as string, query),
    enabled: Boolean(productId),
  });
}
