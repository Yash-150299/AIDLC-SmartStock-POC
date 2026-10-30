/**
 * Non-field error banner with a generic message, a subtle correlationId, and a user-triggered
 * single Retry action (Q5=A, EH-W7/EH-W10). Field-level validation is rendered inline by forms;
 * this is for transient/500/network errors.
 */
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { ApiError } from '../api/ApiError';

export function ErrorBanner({
  error,
  onRetry,
  title = 'Something went wrong',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message = ApiError.isApiError(error)
    ? error.message
    : 'An unexpected error occurred. Please try again.';
  const correlationId = ApiError.isApiError(error) ? error.correlationId : undefined;

  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
      sx={{ my: 2 }}
    >
      <AlertTitle>{title}</AlertTitle>
      <Box>{message}</Box>
      {correlationId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Reference: {correlationId}
        </Typography>
      )}
    </Alert>
  );
}
