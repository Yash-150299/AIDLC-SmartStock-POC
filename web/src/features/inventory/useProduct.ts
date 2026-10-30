/**
 * Query hook for `GET /products/:id` (details / edit prefill). A `NOT_FOUND` from the server
 * surfaces as an `ApiError` the caller can render as a not-found view (EH-W5).
 */
import { useQuery } from '@tanstack/react-query';
import type { ProductDto } from '@smartstock/shared';
import { getProduct } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useProduct(id: string | undefined) {
  return useQuery<ProductDto>({
    queryKey: id ? queryKeys.product(id) : ['products', 'detail', 'missing'],
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
  });
}
