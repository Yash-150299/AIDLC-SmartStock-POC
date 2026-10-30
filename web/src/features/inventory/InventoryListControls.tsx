/**
 * Inventory list controls: search (debounced 300ms upstream), category filter, stock-status
 * filter, and sort (name/stock/price + asc/desc). Each change issues a new query and the list
 * page resets to page 1 (BR-W6).
 */
import { Box, MenuItem, TextField } from '@mui/material';
import {
  SORT_FIELD_VALUES,
  SORT_DIRECTION_VALUES,
  STOCK_STATUS_VALUES,
  SortDirection,
  SortField,
  type CategoryDto,
  type SortDirection as SortDirectionType,
  type SortField as SortFieldType,
  type StockStatus,
} from '@smartstock/shared';
import { statusChipLabel } from '../../theme';

const SORT_FIELD_LABELS: Record<SortFieldType, string> = {
  [SortField.name]: 'Name',
  [SortField.stock]: 'Stock',
  [SortField.price]: 'Price',
};

const SORT_DIRECTION_LABELS: Record<SortDirectionType, string> = {
  [SortDirection.asc]: 'Ascending',
  [SortDirection.desc]: 'Descending',
};

export interface InventoryControlsValue {
  search: string;
  category: string;
  stockStatus: '' | StockStatus;
  sortBy: SortFieldType;
  sortDir: SortDirectionType;
}

export function InventoryListControls({
  value,
  categories,
  onChange,
}: {
  value: InventoryControlsValue;
  categories: CategoryDto[];
  onChange: (next: Partial<InventoryControlsValue>) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
        mb: 2,
      }}
    >
      <TextField
        label="Search name or SKU"
        value={value.search}
        onChange={(e) => onChange({ search: e.target.value })}
        size="small"
      />
      <TextField
        select
        label="Category"
        value={value.category}
        onChange={(e) => onChange({ category: e.target.value })}
        size="small"
      >
        <MenuItem value="">All categories</MenuItem>
        {categories.map((c) => (
          <MenuItem key={c.id} value={String(c.id)}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Status"
        value={value.stockStatus}
        onChange={(e) => onChange({ stockStatus: e.target.value as '' | StockStatus })}
        size="small"
      >
        <MenuItem value="">All statuses</MenuItem>
        {STOCK_STATUS_VALUES.map((s) => (
          <MenuItem key={s} value={s}>
            {statusChipLabel[s]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Sort by"
        value={value.sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value as SortFieldType })}
        size="small"
      >
        {SORT_FIELD_VALUES.map((f) => (
          <MenuItem key={f} value={f}>
            {SORT_FIELD_LABELS[f]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Direction"
        value={value.sortDir}
        onChange={(e) => onChange({ sortDir: e.target.value as SortDirectionType })}
        size="small"
      >
        {SORT_DIRECTION_VALUES.map((d) => (
          <MenuItem key={d} value={d}>
            {SORT_DIRECTION_LABELS[d]}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
