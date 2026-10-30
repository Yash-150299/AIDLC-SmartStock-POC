/**
 * Shared error codes + standard error-response shape (error-standards.md, shared-contracts.md).
 * Produced by backend; surfaced by web and mobile (FR-39).
 */

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_SKU: 'DUPLICATE_SKU',
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Standard error-response body. `details` carries field-level validation info when present. */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    correlationId: string;
  };
}
