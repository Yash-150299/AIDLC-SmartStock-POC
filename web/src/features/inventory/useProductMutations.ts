/**
 * Create + update product mutations. On success they invalidate exactly the caches in
 * BL-W9/BR-W10: create → product lists + dashboard; edit → product lists + that product + dashboard.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProductRequest, ProductDto, UpdateProductRequest } from '@smartstock/shared';
import { createProduct, updateProduct } from '../../api/endpoints';
import { queryKeys } from '../../queryClient';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<ProductDto, unknown, CreateProductRequest>({
    mutationFn: (body) => createProduct(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useUpdateProduct(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation<ProductDto, unknown, UpdateProductRequest>({
    mutationFn: (body) => updateProduct(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.product(id), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.productsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}
