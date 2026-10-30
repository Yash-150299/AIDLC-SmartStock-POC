/**
 * Inventory list page — composes controls + table + pagination, owns the query-param state, and
 * handles loading + error (Retry) states. Search is debounced 300ms (Q4=A) and any control change
 * resets to page 1 (BR-W6).
 */
import { useMemo, useState } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  STOCK_STATUS_VALUES,
  SortDirection,
  SortField,
  type ProductListQuery,
  type StockStatus,
} from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { InventoryListControls, type InventoryControlsValue } from './InventoryListControls';
import { ProductTable } from './ProductTable';
import { PaginationControls } from './PaginationControls';
import { useProductListQuery } from './useProductListQuery';
import { useCategories } from './useCategories';

/** Read and validate the `status` query param (set by the clickable dashboard tiles). */
function readStatusParam(raw: string | null): '' | StockStatus {
  return raw && (STOCK_STATUS_VALUES as readonly string[]).includes(raw) ? (raw as StockStatus) : '';
}

export function InventoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [controls, setControls] = useState<InventoryControlsValue>(() => ({
    search: '',
    category: '',
    stockStatus: readStatusParam(searchParams.get('status')),
    sortBy: SortField.name,
    sortDir: SortDirection.asc,
  }));
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(controls.search, 300);
  const categories = useCategories();

  const query = useMemo<ProductListQuery>(
    () => ({
      search: debouncedSearch || undefined,
      category: controls.category ? Number(controls.category) : undefined,
      stockStatus: (controls.stockStatus || undefined) as StockStatus | undefined,
      sortBy: controls.sortBy,
      sortDir: controls.sortDir,
      page,
      pageSize: 20,
    }),
    [debouncedSearch, controls.category, controls.stockStatus, controls.sortBy, controls.sortDir, page],
  );

  const list = useProductListQuery(query);

  const handleControlsChange = (next: Partial<InventoryControlsValue>) => {
    setControls((prev) => ({ ...prev, ...next }));
    setPage(1);

    // Keep the `status` query param in sync so a tile-driven filter is visible, bookmarkable,
    // and cleared from the URL when the user picks "All statuses".
    if ('stockStatus' in next) {
      setSearchParams(
        (params) => {
          if (next.stockStatus) {
            params.set('status', next.stockStatus);
          } else {
            params.delete('status');
          }
          return params;
        },
        { replace: true },
      );
    }
  };

  return (
    <Box>
      <PageHeader
        title="Inventory"
        action={
          <Button
            component={RouterLink}
            to="/inventory/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add product
          </Button>
        }
      />

      <InventoryListControls
        value={controls}
        categories={categories.data ?? []}
        onChange={handleControlsChange}
      />

      {list.isLoading ? (
        <LoadingIndicator label="Loading products…" />
      ) : list.isError ? (
        <ErrorBanner error={list.error} onRetry={() => void list.refetch()} title="Could not load products" />
      ) : (
        list.data && (
          <>
            <ProductTable products={list.data.items} />
            {list.data.total > 0 && (
              <PaginationControls
                page={list.data.page}
                pageSize={list.data.pageSize}
                total={list.data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )
      )}
    </Box>
  );
}
