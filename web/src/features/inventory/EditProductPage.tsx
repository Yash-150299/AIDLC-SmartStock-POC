/**
 * Routed `/inventory/:id/edit` (Q3=A). Prefills from `useProduct`; SKU is read-only (BR-W7). The
 * update mutation invalidates caches (BL-W6). A `NOT_FOUND` renders the not-found view (EH-W5).
 */
import { Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorCode, type UpdateProductRequest } from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ApiError } from '../../api/ApiError';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';
import { ProductForm, type ProductFormPayload, type ProductFormValues } from './ProductForm';
import { NotFoundProduct } from './NotFoundProduct';
import { useCategories } from './useCategories';
import { useProduct } from './useProduct';
import { useUpdateProduct } from './useProductMutations';

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useProduct(id);
  const categories = useCategories();
  const update = useUpdateProduct(id ?? '');
  const presentation = useApiErrorMessage(update.error);

  if (product.isLoading || categories.isLoading) {
    return <LoadingIndicator label="Loading product…" />;
  }

  if (product.isError) {
    if (ApiError.isApiError(product.error) && product.error.code === ErrorCode.NOT_FOUND) {
      return <NotFoundProduct />;
    }
    return <ErrorBanner error={product.error} onRetry={() => void product.refetch()} title="Could not load product" />;
  }

  if (!product.data) {
    return <NotFoundProduct />;
  }

  const initialValues: ProductFormValues = {
    name: product.data.name,
    sku: product.data.sku,
    categoryId: String(product.data.categoryId),
    currentStock: String(product.data.currentStock),
    reorderLevel: String(product.data.reorderLevel),
    unitPrice: String(product.data.unitPrice),
    description: product.data.description ?? '',
  };

  const handleSubmit = (payload: ProductFormPayload) => {
    // SKU is immutable on edit (BR-W7) — omitted from the update request.
    const body: UpdateProductRequest = {
      name: payload.name,
      categoryId: payload.categoryId,
      currentStock: payload.currentStock,
      reorderLevel: payload.reorderLevel,
      unitPrice: payload.unitPrice,
      description: payload.description,
    };
    update.mutate(body, {
      onSuccess: (updated) => navigate(`/inventory/${updated.id}`, { replace: true }),
    });
  };

  return (
    <Box>
      <PageHeader title={`Edit ${product.data.name}`} />
      {presentation.formError && <ErrorBanner error={update.error} title="Could not save changes" />}
      <ProductForm
        mode="edit"
        initialValues={initialValues}
        categories={categories.data ?? []}
        serverFieldErrors={presentation.fieldErrors}
        submitting={update.isPending}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/inventory/${product.data.id}`)}
      />
    </Box>
  );
}
