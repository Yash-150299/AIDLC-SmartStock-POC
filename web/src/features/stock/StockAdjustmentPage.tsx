/**
 * Routed `/inventory/:id/adjust`. Type toggle (Stock In / Stock Out), quantity, and reason. Client
 * pre-validation uses the shared helpers (`isPositiveInteger`, `isNonBlank`) (BR-W5). A
 * `NEGATIVE_STOCK` (EH-W6) is surfaced without changing the displayed stock.
 */
import { useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdjustmentType,
  ErrorCode,
  isNonBlank,
  isPositiveInteger,
  type AdjustmentType as AdjustmentTypeType,
  type StockAdjustmentRequest,
} from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { StatusChip } from '../../components/StatusChip';
import { ApiError } from '../../api/ApiError';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';
import { NotFoundProduct } from '../inventory/NotFoundProduct';
import { useProduct } from '../inventory/useProduct';
import { useStockAdjustment } from './useStockAdjustment';

export function StockAdjustmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useProduct(id);
  const adjust = useStockAdjustment(id ?? '');
  const presentation = useApiErrorMessage(adjust.error);

  const [type, setType] = useState<AdjustmentTypeType>(AdjustmentType.STOCK_IN);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  if (product.isLoading) {
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

  const p = product.data;
  const quantityNum = Number(quantity);
  const quantityInvalid = touched && !isPositiveInteger(quantityNum);
  const reasonInvalid = touched && !isNonBlank(reason);
  const negativeStock =
    ApiError.isApiError(adjust.error) && adjust.error.code === ErrorCode.NEGATIVE_STOCK;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isPositiveInteger(quantityNum) || !isNonBlank(reason)) {
      return;
    }
    const body: StockAdjustmentRequest = { type, quantity: quantityNum, reason: reason.trim() };
    adjust.mutate(body, {
      onSuccess: () => navigate(`/inventory/${p.id}`, { replace: true }),
    });
  };

  return (
    <Box>
      <PageHeader title={`Adjust stock — ${p.name}`} />

      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1">Current stock: {p.currentStock}</Typography>
          <StatusChip status={p.stockStatus} />
        </Stack>
      </Paper>

      {negativeStock && (
        <ErrorBanner error={adjust.error} title="Adjustment rejected" />
      )}
      {presentation.formError && !negativeStock && (
        <ErrorBanner error={adjust.error} title="Could not record adjustment" />
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <ToggleButtonGroup
              exclusive
              value={type}
              onChange={(_e, next: AdjustmentTypeType | null) => next && setType(next)}
              aria-label="Adjustment type"
            >
              <ToggleButton value={AdjustmentType.STOCK_IN}>Stock In</ToggleButton>
              <ToggleButton value={AdjustmentType.STOCK_OUT}>Stock Out</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={quantityInvalid}
              helperText={quantityInvalid ? 'Enter a positive whole number.' : ' '}
              inputProps={{ min: 1, step: 1 }}
            />
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={reasonInvalid}
              helperText={reasonInvalid ? 'A reason is required.' : ' '}
              multiline
              minRows={2}
            />

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={adjust.isPending}>
                {adjust.isPending ? 'Saving…' : 'Record adjustment'}
              </Button>
              <Button type="button" onClick={() => navigate(`/inventory/${p.id}`)} disabled={adjust.isPending}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
