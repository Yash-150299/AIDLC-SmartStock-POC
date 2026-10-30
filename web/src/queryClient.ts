/**
 * Single React Query client + a central query-key factory. Hooks read with these keys and
 * mutations invalidate exactly the right keys on success (BL-W9/BR-W10), keeping list, details,
 * history, and dashboard caches consistent after a write.
 */
import { QueryClient } from '@tanstack/react-query';
import type { ProductListQuery } from '@smartstock/shared';
import type { AdjustmentHistoryQuery } from './api/endpoints';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // User-triggered retry (Q5=A): no silent auto-retries; the UI offers a Retry action.
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  dashboardStats: ['dashboard', 'stats'] as const,
  categories: ['categories'] as const,
  productsRoot: ['products'] as const,
  productList: (query: ProductListQuery) => ['products', 'list', query] as const,
  product: (id: string | number) => ['products', 'detail', String(id)] as const,
  adjustmentHistoryRoot: (productId: string | number) =>
    ['products', String(productId), 'adjustments'] as const,
  adjustmentHistory: (productId: string | number, query: AdjustmentHistoryQuery) =>
    ['products', String(productId), 'adjustments', query] as const,
};
