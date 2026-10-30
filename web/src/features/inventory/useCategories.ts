/**
 * Query hook for `GET /categories` — the fixed seeded list used by the filter dropdown and the
 * product form select. Cached with a long stale time since the list rarely changes.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CategoryDto, CreateCategoryRequest } from '@smartstock/shared';
import { createCategory, getCategories } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useCategories() {
  return useQuery<CategoryDto[]>({
    queryKey: queryKeys.categories,
    queryFn: () => getCategories(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Create a new product category. On success the categories cache is invalidated so the filter and
 * product-form dropdowns immediately reflect the new category.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryDto, unknown, CreateCategoryRequest>({
    mutationFn: (body) => createCategory(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
