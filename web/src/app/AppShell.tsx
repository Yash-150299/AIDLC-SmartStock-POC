/**
 * Authenticated layout — MUI AppBar with navigation (Dashboard, Inventory) and a logout action
 * (ST-2, FR-32). Page content renders through `<Outlet/>`.
 */
import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useLogout } from '../features/auth/useLogout';
import { useAuth } from '../auth/AuthContext';

export function AppShell() {
  const { user } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleConfirmLogout = () => {
    logout.mutate(undefined, {
      // Keep the dialog up (with a disabled, pending button) until the logout resolves, then close.
      onSettled: () => setConfirmOpen(false),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ mr: 3 }}>
            SmartStock
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <Button
              component={RouterLink}
              to="/dashboard"
              color="inherit"
              variant={isActive('/dashboard') ? 'outlined' : 'text'}
            >
              Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/inventory"
              color="inherit"
              variant={isActive('/inventory') ? 'outlined' : 'text'}
            >
              Inventory
            </Button>
          </Box>
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.username}
            </Typography>
          )}
          <Button
            color="inherit"
            onClick={() => setConfirmOpen(true)}
            disabled={logout.isPending}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!logout.isPending) setConfirmOpen(false);
        }}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">Log out?</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to log out? You will need to sign in again to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={logout.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirmLogout} color="primary" variant="contained" disabled={logout.isPending} autoFocus>
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
