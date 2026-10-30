/**
 * Login form — identifier + password with show/hide, loading spinner + disabled submit (no double
 * submit), client pre-validation that both fields are present (BR-W5), and inline error on
 * `INVALID_CREDENTIALS` (EH-W2). Shows a "session ended" notice when redirected here after expiry
 * (EH-W3). Already-authenticated users are sent to the dashboard.
 */
import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Navigate, useSearchParams } from 'react-router-dom';
import { isNonBlank } from '@smartstock/shared';
import { useLogin } from './useLogin';
import { useAuth } from '../../auth/AuthContext';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';
import { SESSION_EXPIRED_FLAG } from '../../api/httpClient';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const login = useLogin();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get(SESSION_EXPIRED_FLAG) === '1';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const presentation = useApiErrorMessage(login.error);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const identifierMissing = touched && !isNonBlank(identifier);
  const passwordMissing = touched && !isNonBlank(password);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isNonBlank(identifier) || !isNonBlank(password)) {
      return;
    }
    login.mutate({ identifier: identifier.trim(), password });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            SmartStock
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to manage inventory.
          </Typography>

          {sessionExpired && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your session ended. Please sign in again.
            </Alert>
          )}

          {presentation.formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {presentation.formError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={identifierMissing}
                helperText={identifierMissing ? 'Enter your username or email.' : ' '}
                autoComplete="username"
                fullWidth
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordMissing}
                helperText={passwordMissing ? 'Enter your password.' : ' '}
                autoComplete="current-password"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" size="large" disabled={login.isPending} fullWidth>
                {login.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
