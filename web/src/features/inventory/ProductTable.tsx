/**
 * MUI table of products (name, SKU, category, stock, reorder, price, StatusChip, row actions →
 * details / edit / adjust). Renders an EmptyState when there are zero items (EH-W8).
 */
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { ProductDto } from '@smartstock/shared';
import { StatusChip } from '../../components/StatusChip';
import { EmptyState } from '../../components/EmptyState';

export function ProductTable({ products }: { products: ProductDto[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your search or filters, or add a new product."
        action={
          <Button component={RouterLink} to="/inventory/new" variant="contained">
            Add product
          </Button>
        }
      />
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell align="right">Reorder</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.categoryName}</TableCell>
              <TableCell align="right">{product.currentStock}</TableCell>
              <TableCell align="right">{product.reorderLevel}</TableCell>
              <TableCell align="right">{product.unitPrice.toFixed(2)}</TableCell>
              <TableCell>
                <StatusChip status={product.stockStatus} />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" component={RouterLink} to={`/inventory/${product.id}`}>
                    View
                  </Button>
                  <Button size="small" component={RouterLink} to={`/inventory/${product.id}/edit`}>
                    Edit
                  </Button>
                  <Button size="small" component={RouterLink} to={`/inventory/${product.id}/adjust`}>
                    Adjust
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
