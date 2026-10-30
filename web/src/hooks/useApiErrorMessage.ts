/**
 * Maps an `ApiError` to a presentation shape that forms and banners share (EH-W1..W6):
 * a map of field -> message for inline display, plus a single form-level message for anything
 * that is not field-specific.
 */
import { useMemo } from 'react';
import { ApiError } from '../api/ApiError';

export interface ApiErrorPresentation {
  /** Field-level messages keyed by field name (from VALIDATION_ERROR details). */
  fieldErrors: Record<string, string>;
  /** A single non-field message for a banner / form header, or undefined when none. */
  formError?: string;
  /** correlationId for the "Reference:" hint, when present. */
  correlationId?: string;
}

export function toApiErrorPresentation(error: unknown): ApiErrorPresentation {
  if (!ApiError.isApiError(error)) {
    if (error == null) {
      return { fieldErrors: {} };
    }
    return { fieldErrors: {}, formError: 'An unexpected error occurred. Please try again.' };
  }

  const fieldErrors: Record<string, string> = {};
  for (const fe of error.fieldErrors) {
    fieldErrors[fe.field] = fe.message;
  }

  // If every detail mapped to a field, the message is a header for those field errors; otherwise
  // it is the form-level message to display on its own.
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  return {
    fieldErrors,
    formError: hasFieldErrors ? undefined : error.message,
    correlationId: error.correlationId,
  };
}

export function useApiErrorMessage(error: unknown): ApiErrorPresentation {
  return useMemo(() => toApiErrorPresentation(error), [error]);
}
