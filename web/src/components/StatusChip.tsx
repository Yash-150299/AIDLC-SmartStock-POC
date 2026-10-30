/**
 * Renders a `StockStatus` as a labeled MUI Chip. Color is reinforcement only — the text label is
 * always present and the chip carries an accessible name (BR-W9, WCAG AA).
 */
import Chip from '@mui/material/Chip';
import type { StockStatus } from '@smartstock/shared';
import { statusChipColor, statusChipLabel } from '../theme';

export function StatusChip({ status, size = 'small' }: { status: StockStatus; size?: 'small' | 'medium' }) {
  const label = statusChipLabel[status];
  return (
    <Chip
      label={label}
      color={statusChipColor[status]}
      size={size}
      variant="filled"
      aria-label={`Stock status: ${label}`}
    />
  );
}
