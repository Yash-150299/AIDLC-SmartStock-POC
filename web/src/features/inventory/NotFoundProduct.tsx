/**
 * Page-level not-found for a missing product id, with a path back to the list (EH-W5).
 */
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';

export function NotFoundProduct() {
  return (
    <EmptyState
      title="Product not found"
      description="This product may have been removed or the link is incorrect."
      action={
        <Button component={RouterLink} to="/inventory" variant="contained">
          Back to inventory
        </Button>
      }
    />
  );
}
