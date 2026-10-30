/**
 * Dashboard — four SummaryCards plus a paginated inventory overview (10 products per page with
 * StatusChip) and a manual Refresh button (BR-W8). Every value is server-provided; none is
 * recomputed in the client (FR-13). The summary cards are clickable: Total Products opens the full
 * inventory list, Low Stock and Out of Stock open it pre-filtered by the matching stock status.
 */
import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link as RouterLink } from 'react-router-dom';
import { CircularProgress, Stack } from '@mui/material';
import { SortField, SortDirection, StockStatus } from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ErrorBanner } from '../../components/ErrorBanner';
import { StatusChip } from '../../components/StatusChip';
import { useDashboardStats } from './useDashboardStats';
import { SummaryCard } from './SummaryCard';
import { AddCategoryQuickAction } from './AddCategoryQuickAction';
import { useProductListQuery } from '../inventory/useProductListQuery';
import { PaginationControls } from '../inventory/PaginationControls';

const OVERVIEW_PAGE_SIZE = 10;

export function DashboardPage() {
  const stats = useDashboardStats();
  const [page, setPage] = useState(1);
  const overview = useProductListQuery({
    sortBy: SortField.name,
    sortDir: SortDirection.asc,
    page,
    pageSize: OVERVIEW_PAGE_SIZE,
  });

  // Refreshing when either the stats or the overview list is re-fetching.
  const isRefreshing = stats.isFetching || overview.isFetching;

  const handleRefresh = () => {
    void stats.refetch();
    void overview.refetch();
  };

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        action={
          <Stack direction="row" spacing={1}>
            <AddCategoryQuickAction />
            <Button
              startIcon={
                isRefreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />
              }
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </Stack>
        }
      />

      {stats.isLoading ? (
        <LoadingIndicator label="Loading dashboard…" />
      ) : stats.isError ? (
        <ErrorBanner error={stats.error} onRetry={() => void stats.refetch()} title="Could not load dashboard" />
      ) : (
        stats.data && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Total Products" value={stats.data.totalProducts} to="/inventory" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Total Stock Units" value={stats.data.totalStockUnits} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                label="Low Stock Items"
                value={stats.data.lowStockItems}
                emphasis="warning"
                to={`/inventory?status=${StockStatus.LOW_STOCK}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                label="Out of Stock Items"
                value={stats.data.outOfStockItems}
                emphasis="error"
                to={`/inventory?status=${StockStatus.OUT_OF_STOCK}`}
              />
            </Grid>
          </Grid>
        )
      )}

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Inventory overview
      </Typography>
      {overview.isLoading ? (
        <LoadingIndicator label="Loading products…" />
      ) : overview.isError ? (
        <ErrorBanner error={overview.error} onRetry={() => void overview.refetch()} title="Could not load products" />
      ) : (
        overview.data && (
          <>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overview.data.items.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <RouterLink to={`/inventory/${product.id}`}>{product.name}</RouterLink>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell align="right">{product.currentStock}</TableCell>
                      <TableCell>
                        <StatusChip status={product.stockStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {overview.data.total > 0 && (
              <PaginationControls
                page={overview.data.page}
                pageSize={overview.data.pageSize}
                total={overview.data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )
      )}
    </Box>
  );
}
