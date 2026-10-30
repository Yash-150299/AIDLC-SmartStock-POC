/**
 * Routed `/inventory/:id/history`. Table of adjustments (type, quantity, reason, resultingStock,
 * createdAt) with server-driven paging; EmptyState when there are none (EH-W8).
 */
import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { AdjustmentType } from '@smartstock/shared';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { PaginationControls } from '../inventory/PaginationControls';
import { useAdjustmentHistory } from './useAdjustmentHistory';

export function AdjustmentHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const history = useAdjustmentHistory(id, page);

  return (
    <Box>
      <PageHeader
        title="Adjustment history"
        action={
          <Button variant="outlined" onClick={() => navigate(`/inventory/${id}`)}>
            Back to product
          </Button>
        }
      />

      {history.isLoading ? (
        <LoadingIndicator label="Loading history…" />
      ) : history.isError ? (
        <ErrorBanner error={history.error} onRetry={() => void history.refetch()} title="Could not load history" />
      ) : history.data && history.data.items.length === 0 ? (
        <EmptyState title="No adjustments yet" description="Stock adjustments for this product will appear here." />
      ) : (
        history.data && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Resulting stock</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.data.items.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={a.type === AdjustmentType.STOCK_IN ? 'Stock In' : 'Stock Out'}
                          color={a.type === AdjustmentType.STOCK_IN ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{a.quantity}</TableCell>
                      <TableCell>{a.reason}</TableCell>
                      <TableCell align="right">{a.resultingStock}</TableCell>
                      <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {history.data.total > 0 && (
              <PaginationControls
                page={history.data.page}
                pageSize={history.data.pageSize}
                total={history.data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )
      )}
    </Box>
  );
}
