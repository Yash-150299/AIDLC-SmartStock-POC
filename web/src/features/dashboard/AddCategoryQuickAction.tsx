/**
 * Dashboard quick action: add a new product category. A button opens a small dialog with a single
 * name field; on success the categories cache is invalidated (so the inventory filter and the
 * product form dropdown pick it up immediately) and a confirmation snackbar is shown. Server-side
 * validation (blank or duplicate name) surfaces inline on the field.
 */
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import { ApiError } from '../../api/ApiError';
import { useCreateCategory } from '../inventory/useCategories';

export function AddCategoryQuickAction() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [snackOpen, setSnackOpen] = useState(false);
  const [createdName, setCreatedName] = useState('');
  const create = useCreateCategory();

  const close = () => {
    if (create.isPending) return;
    setOpen(false);
    setName('');
    setFieldError(undefined);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError('Category name is required.');
      return;
    }
    setFieldError(undefined);
    create.mutate(
      { name: trimmed },
      {
        onSuccess: (category) => {
          setCreatedName(category.name);
          setSnackOpen(true);
          setOpen(false);
          setName('');
        },
        onError: (err) => {
          // Surface a blank/duplicate-name validation message inline on the field.
          if (ApiError.isApiError(err)) {
            const details = err.details as { name?: string[] } | undefined;
            setFieldError(details?.name?.[0] ?? err.message);
          } else {
            setFieldError('Could not add the category. Please try again.');
          }
        },
      },
    );
  };

  return (
    <>
      <Button startIcon={<CategoryIcon />} onClick={() => setOpen(true)}>
        Add category
      </Button>

      <Dialog open={open} onClose={close} aria-labelledby="add-category-title" fullWidth maxWidth="xs">
        <DialogTitle id="add-category-title">Add product category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category name"
            fullWidth
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldError) setFieldError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            error={Boolean(fieldError)}
            helperText={fieldError ?? ' '}
            disabled={create.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add category'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackOpen(false)}>
          Category “{createdName}” added.
        </Alert>
      </Snackbar>
    </>
  );
}
