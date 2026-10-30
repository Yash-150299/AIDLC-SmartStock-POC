/**
 * Mutation for `POST /products/:id/stock-adjustments`. On success invalidates the product details,
 * its adjustment history, the product lists, and the dashboard (BL-W8/BL-W9). A `NEGATIVE_STOCK`
 * (EH-W6) surfaces as an `ApiError` the page renders without changing the displayed stock.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StockAdjustmentRequest, StockAdjustmentResult } from '@smartstock/shared';
import { createStockAdjustment } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useStockAdjustment(productId: string | number) {
  const queryClient = useQueryClient();
  return useMutation<StockAdjustmentResult, unknown, StockAdjustmentRequest>({
    mutationFn: (body) => createStockAdjustment(productId, body),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.product(productId), result.product);
      void queryClient.invalidateQueries({ queryKey: queryKeys.adjustmentHistoryRoot(productId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.productsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}
