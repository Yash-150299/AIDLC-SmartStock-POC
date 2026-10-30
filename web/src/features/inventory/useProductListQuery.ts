/**
 * Query hook for `GET /products`. The cache key includes the full `ProductListQuery` so each
 * param combination is cached independently; the server `total` drives the pager. Page size
 * defaults to 20 / clamps to 100 via the shared `normalizePagination` (BL-W4/BR-W6).
 */
import { useQuery } from '@tanstack/react-query';
import {
  normalizePagination,
  normalizeSearchTerm,
  type Paginated,
  type ProductDto,
  type ProductListQuery,
} from '@smartstock/shared';
import { listProducts } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useProductListQuery(query: ProductListQuery) {
  const { page, pageSize } = normalizePagination(query.page, query.pageSize);
  const normalized: ProductListQuery = {
    ...query,
    search: normalizeSearchTerm(query.search),
    page,
    pageSize,
  };

  return useQuery<Paginated<ProductDto>>({
    queryKey: queryKeys.productList(normalized),
    queryFn: () => listProducts(normalized),
  });
}
