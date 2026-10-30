/**
 * Pager driven entirely by the server `total` / `page` / `pageSize` (BR-W6).
 */
import { Box, Pagination, Typography } from '@mui/material';

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {from}–{to} of {total}
      </Typography>
      <Pagination
        page={page}
        count={pageCount}
        onChange={(_event, value) => onPageChange(value)}
        color="primary"
        shape="rounded"
      />
    </Box>
  );
}
