/**
 * Typed client-side error normalizing the shared `ErrorResponse` shape (error-standards.md,
 * EH-W1..W10). Every rejected API call surfaces as an `ApiError` so UI code can switch on
 * `code` (an `ErrorCode`) rather than parse raw responses.
 */
import { ErrorCode, type ErrorResponse } from '@smartstock/shared';

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly correlationId?: string;
  /** Field-level validation details when the server provided them (EH-W1). */
  readonly fieldErrors: FieldError[];
  readonly details?: unknown;

  constructor(params: {
    code: ErrorCode;
    message: string;
    httpStatus: number;
    correlationId?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.correlationId = params.correlationId;
    this.details = params.details;
    this.fieldErrors = extractFieldErrors(params.details);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True when the server returned a well-formed standard error body. */
  static isApiError(value: unknown): value is ApiError {
    return value instanceof ApiError;
  }
}

/** Narrow an unknown payload to the shared `ErrorResponse` shape. */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const err = (value as { error?: unknown }).error;
  if (typeof err !== 'object' || err === null) {
    return false;
  }
  const { code, message, correlationId } = err as Record<string, unknown>;
  return typeof code === 'string' && typeof message === 'string' && typeof correlationId === 'string';
}

/**
 * Build an `ApiError` from an HTTP status + response body. Falls back to `INTERNAL_ERROR`
 * for malformed/absent bodies (EH-W7).
 */
export function apiErrorFromResponse(httpStatus: number, body: unknown): ApiError {
  if (isErrorResponse(body)) {
    return new ApiError({
      code: body.error.code,
      message: body.error.message,
      httpStatus,
      correlationId: body.error.correlationId,
      details: body.error.details,
    });
  }
  return new ApiError({
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Something went wrong. Please try again.',
    httpStatus,
  });
}

/** Build an `ApiError` for a network/transport failure with no HTTP response (EH-W7). */
export function networkApiError(message = 'Unable to reach the server. Check your connection and retry.'): ApiError {
  return new ApiError({ code: ErrorCode.INTERNAL_ERROR, message, httpStatus: 0 });
}

function extractFieldErrors(details: unknown): FieldError[] {
  if (!Array.isArray(details)) {
    return [];
  }
  const result: FieldError[] = [];
  for (const entry of details) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const { field, message } = record;
    if (typeof field === 'string' && typeof message === 'string') {
      result.push({ field, message });
    }
  }
  return result;
}
