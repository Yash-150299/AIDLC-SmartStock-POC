/**
 * Shared create/edit product form. SKU is editable on Add and read-only on Edit (BR-W7). Client
 * pre-validation uses the shared helpers (`isNonBlank`, `isNonNegativeNumber`) (BR-W5) and a live
 * StatusChip preview is derived with the shared `deriveStockStatus` (BR-W9). Inline field errors
 * come from both client pre-validation and server `VALIDATION_ERROR` details; nothing is
 * re-derived server-side in the client.
 */
import { useMemo, useState, type FormEvent } from 'react';
import { Box, Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import {
  deriveStockStatus,
  isNonBlank,
  isNonNegativeNumber,
  type CategoryDto,
} from '@smartstock/shared';
import { StatusChip } from '../../components/StatusChip';

export interface ProductFormValues {
  name: string;
  sku: string;
  categoryId: string;
  currentStock: string;
  reorderLevel: string;
  unitPrice: string;
  description: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  sku: '',
  categoryId: '',
  currentStock: '0',
  reorderLevel: '0',
  unitPrice: '0',
  description: '',
};

/** Parsed, typed payload emitted on a valid submit. `categoryId` is the integer category PK. */
export interface ProductFormPayload {
  name: string;
  sku: string;
  categoryId: number;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  description?: string;
}

type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

export function ProductForm({
  mode,
  initialValues = EMPTY_PRODUCT_FORM,
  categories,
  serverFieldErrors = {},
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initialValues?: ProductFormValues;
  categories: CategoryDto[];
  serverFieldErrors?: Record<string, string>;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (payload: ProductFormPayload) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const set = (field: keyof ProductFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const previewStatus = useMemo(() => {
    const stock = Number(values.currentStock);
    const reorder = Number(values.reorderLevel);
    if (!Number.isFinite(stock) || !Number.isFinite(reorder)) {
      return undefined;
    }
    return deriveStockStatus(stock, reorder);
  }, [values.currentStock, values.reorderLevel]);

  const validate = (): ProductFormPayload | null => {
    const errors: FieldErrors = {};
    const currentStock = Number(values.currentStock);
    const reorderLevel = Number(values.reorderLevel);
    const unitPrice = Number(values.unitPrice);

    if (!isNonBlank(values.name)) errors.name = 'Name is required.';
    if (mode === 'create' && !isNonBlank(values.sku)) errors.sku = 'SKU is required.';
    if (!isNonBlank(values.categoryId)) errors.categoryId = 'Category is required.';
    if (!isNonNegativeNumber(currentStock)) errors.currentStock = 'Enter a non-negative number.';
    if (!isNonNegativeNumber(reorderLevel)) errors.reorderLevel = 'Enter a non-negative number.';
    if (!isNonNegativeNumber(unitPrice)) errors.unitPrice = 'Enter a non-negative number.';

    setClientErrors(errors);
    if (Object.keys(errors).length > 0) {
      return null;
    }

    return {
      name: values.name.trim(),
      sku: values.sku.trim(),
      categoryId: Number(values.categoryId),
      currentStock,
      reorderLevel,
      unitPrice,
      description: isNonBlank(values.description) ? values.description.trim() : undefined,
    };
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = validate();
    if (payload) {
      onSubmit(payload);
    }
  };

  const errorFor = (field: keyof ProductFormValues) => clientErrors[field] ?? serverFieldErrors[field];

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            error={Boolean(errorFor('name'))}
            helperText={errorFor('name') ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="SKU"
            value={values.sku}
            onChange={(e) => set('sku', e.target.value)}
            error={Boolean(errorFor('sku'))}
            helperText={errorFor('sku') ?? (mode === 'edit' ? 'SKU cannot be changed.' : ' ')}
            disabled={mode === 'edit'}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Category"
            value={values.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            error={Boolean(errorFor('categoryId'))}
            helperText={errorFor('categoryId') ?? ' '}
            fullWidth
          >
            {categories.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
            Status preview: {previewStatus ? <StatusChip status={previewStatus} /> : '—'}
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Current stock"
            type="number"
            value={values.currentStock}
            onChange={(e) => set('currentStock', e.target.value)}
            error={Boolean(errorFor('currentStock'))}
            helperText={errorFor('currentStock') ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Reorder level"
            type="number"
            value={values.reorderLevel}
            onChange={(e) => set('reorderLevel', e.target.value)}
            error={Boolean(errorFor('reorderLevel'))}
            helperText={errorFor('reorderLevel') ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Unit price"
            type="number"
            value={values.unitPrice}
            onChange={(e) => set('unitPrice', e.target.value)}
            error={Boolean(errorFor('unitPrice'))}
            helperText={errorFor('unitPrice') ?? ' '}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Description"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            error={Boolean(errorFor('description'))}
            helperText={errorFor('description') ?? ' '}
            multiline
            minRows={2}
            fullWidth
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}
