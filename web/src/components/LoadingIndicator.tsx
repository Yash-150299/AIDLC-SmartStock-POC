/**
 * Centered spinner with an accessible label (EH-W9).
 */
import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingIndicator({ label = 'Loading…' }: { label?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 6 }}>
      <CircularProgress aria-label={label} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
