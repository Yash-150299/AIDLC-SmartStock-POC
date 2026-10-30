/**
 * Consistent page title with an optional action slot on the right.
 */
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      {action}
    </Box>
  );
}
