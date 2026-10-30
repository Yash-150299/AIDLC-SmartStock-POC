/**
 * MUI theme (Q1=A). Status colors are reinforcement only — the StatusChip always renders text, so
 * meaning never depends on color alone (BR-W9, WCAG AA).
 */
import { createTheme } from '@mui/material/styles';
import type { StockStatus } from '@smartstock/shared';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#5e35b1' },
  },
  shape: { borderRadius: 8 },
});

/** MUI Chip color per stock status (reinforcement only; label text is always present). */
export const statusChipColor: Record<StockStatus, 'success' | 'warning' | 'error'> = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'error',
};

/** Human-readable label per stock status. */
export const statusChipLabel: Record<StockStatus, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};
