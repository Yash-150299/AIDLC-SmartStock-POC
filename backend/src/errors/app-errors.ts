/**
 * Typed error classes mapping to the fixed taxonomy (error-standards.md). Services throw these;
 * the terminal error middleware renders them in the standard shape (FR-39, BR-10).
 */
import { ErrorCode } from '@smartstock/shared';

/** Base for all domain/application errors carrying an HTTP status + machine code. */
export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly httpStatus: number;
  readonly details?: unknown;

  protected constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly httpStatus = 400;
  constructor(message = 'Please check the highlighted fields and try again.', details?: unknown) {
    super(message, details);
  }
}

export class InvalidCredentialsError extends AppError {
  readonly code = ErrorCode.INVALID_CREDENTIALS;
  readonly httpStatus = 401;
  constructor(message = 'The username/email or password is incorrect.') {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly httpStatus = 401;
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly httpStatus = 404;
  constructor(message = 'That resource could not be found.') {
    super(message);
  }
}

export class DuplicateSkuError extends AppError {
  readonly code = ErrorCode.DUPLICATE_SKU;
  readonly httpStatus = 409;
  constructor(message = 'A product with this SKU already exists.') {
    super(message);
  }
}

export class NegativeStockError extends AppError {
  readonly code = ErrorCode.NEGATIVE_STOCK;
  readonly httpStatus = 422;
  constructor(message = 'Not enough stock for this adjustment.') {
    super(message);
  }
}

export class InternalError extends AppError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly httpStatus = 500;
  constructor(message = 'Something went wrong. Please try again.') {
    super(message);
  }
}
