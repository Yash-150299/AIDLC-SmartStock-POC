/**
 * Routed `/inventory/new` (Q3=A). Hosts ProductForm in create mode. On success the create mutation
 * invalidates the list + dashboard caches and navigates to the new product. `VALIDATION_ERROR`
 * (EH-W1) and `DUPLICATE_SKU` (EH-W4) surface inline / as a banner with entered values preserved.
 */
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ErrorCode, type CreateProductRequest } from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ApiError } from '../../api/ApiError';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';
import { ProductForm, type ProductFormPayload } from './ProductForm';
import { useCategories } from './useCategories';
import { useCreateProduct } from './useProductMutations';

export function AddProductPage() {
  const navigate = useNavigate();
  const categories = useCategories();
  const create = useCreateProduct();
  const presentation = useApiErrorMessage(create.error);

  // A DUPLICATE_SKU maps to the sku field so it shows inline on the form (EH-W4).
  const fieldErrors = { ...presentation.fieldErrors };
  if (ApiError.isApiError(create.error) && create.error.code === ErrorCode.DUPLICATE_SKU) {
    fieldErrors.sku = create.error.message;
  }

  const handleSubmit = (payload: ProductFormPayload) => {
    const body: CreateProductRequest = payload;
    create.mutate(body, {
      onSuccess: (product) => navigate(`/inventory/${product.id}`, { replace: true }),
    });
  };

  if (categories.isLoading) {
    return <LoadingIndicator label="Loading form…" />;
  }

  return (
    <Box>
      <PageHeader title="Add product" />
      {presentation.formError && !fieldErrors.sku && (
        <ErrorBanner error={create.error} title="Could not create product" />
      )}
      <ProductForm
        mode="create"
        categories={categories.data ?? []}
        serverFieldErrors={fieldErrors}
        submitting={create.isPending}
        submitLabel="Create product"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/inventory')}
      />
    </Box>
  );
}
