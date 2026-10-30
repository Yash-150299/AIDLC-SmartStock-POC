/**
 * Routed `/inventory/:id`. Shows stock, reorder, price, server-provided StatusChip, description,
 * and lastUpdated; links to Edit / Adjust / History. A `NOT_FOUND` renders the not-found view
 * (EH-W5/BL-W7).
 */
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { ErrorCode } from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { StatusChip } from '../../components/StatusChip';
import { ApiError } from '../../api/ApiError';
import { NotFoundProduct } from './NotFoundProduct';
import { useProduct } from './useProduct';

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Grid>
  );
}

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useProduct(id);

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

  return (
    <Box>
      <PageHeader
        title={p.name}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/inventory')}>
              Back
            </Button>
            <Button component={RouterLink} to={`/inventory/${p.id}/edit`} variant="outlined">
              Edit
            </Button>
            <Button component={RouterLink} to={`/inventory/${p.id}/adjust`} variant="outlined">
              Adjust stock
            </Button>
            <Button component={RouterLink} to={`/inventory/${p.id}/history`} variant="outlined">
              History
            </Button>
          </Stack>
        }
      />

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <StatusChip status={p.stockStatus} size="medium" />
        </Box>
        <Grid container spacing={2}>
          <Field label="SKU" value={p.sku} />
          <Field label="Category" value={p.categoryName} />
          <Field label="Current stock" value={p.currentStock} />
          <Field label="Reorder level" value={p.reorderLevel} />
          <Field label="Unit price" value={p.unitPrice.toFixed(2)} />
          <Field label="Last updated" value={new Date(p.lastUpdated).toLocaleString()} />
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Description
        </Typography>
        <Typography variant="body1">{p.description ?? '—'}</Typography>
      </Paper>
    </Box>
  );
}
