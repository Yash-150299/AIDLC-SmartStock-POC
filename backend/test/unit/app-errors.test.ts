/**
 * Typed error classes map to the fixed taxonomy (error-standards.md, BR-10).
 */
import { ErrorCode } from '@smartstock/shared';
import {
  AppError,
  DuplicateSkuError,
  InternalError,
  InvalidCredentialsError,
  NegativeStockError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/errors/app-errors';

describe('AppError taxonomy', () => {
  const cases: Array<{
    name: string;
    err: AppError;
    code: ErrorCode;
    status: number;
  }> = [
    { name: 'ValidationError', err: new ValidationError(), code: ErrorCode.VALIDATION_ERROR, status: 400 },
    {
      name: 'InvalidCredentialsError',
      err: new InvalidCredentialsError(),
      code: ErrorCode.INVALID_CREDENTIALS,
      status: 401,
    },
    { name: 'UnauthorizedError', err: new UnauthorizedError(), code: ErrorCode.UNAUTHORIZED, status: 401 },
    { name: 'NotFoundError', err: new NotFoundError(), code: ErrorCode.NOT_FOUND, status: 404 },
    { name: 'DuplicateSkuError', err: new DuplicateSkuError(), code: ErrorCode.DUPLICATE_SKU, status: 409 },
    { name: 'NegativeStockError', err: new NegativeStockError(), code: ErrorCode.NEGATIVE_STOCK, status: 422 },
    { name: 'InternalError', err: new InternalError(), code: ErrorCode.INTERNAL_ERROR, status: 500 },
  ];

  it.each(cases)('$name has correct code + httpStatus and is an AppError/Error', ({ err, code, status }) => {
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(code);
    expect(err.httpStatus).toBe(status);
    expect(typeof err.message).toBe('string');
    expect(err.message.length).toBeGreaterThan(0);
  });

  it('ValidationError carries field-level details when provided', () => {
    const details = { sku: ['SKU is required.'] };
    const err = new ValidationError('bad', details);
    expect(err.details).toEqual(details);
    expect(err.message).toBe('bad');
  });

  it('error name reflects the concrete class (for logging)', () => {
    expect(new NotFoundError().name).toBe('NotFoundError');
    expect(new DuplicateSkuError().name).toBe('DuplicateSkuError');
  });

  it('instanceof narrows to the specific subclass', () => {
    const err: unknown = new NegativeStockError();
    expect(err instanceof NegativeStockError).toBe(true);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof ValidationError).toBe(false);
  });
});
