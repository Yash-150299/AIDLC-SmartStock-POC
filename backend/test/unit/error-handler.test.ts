/**
 * Terminal errorHandler — maps AppError to the standard body shape; unknown -> generic 500 with no
 * leaked internals; correlationId is always included (error-standards.md, FR-39).
 */
import type { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '@smartstock/shared';
import { errorHandler } from '../../src/middleware/error-handler';
import { NotFoundError, ValidationError } from '../../src/errors/app-errors';

function mockRes() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const res = { status, json } as unknown as Response;
  return { res, status, json };
}

const req = { correlationId: 'corr-1' } as unknown as Request;
const next = jest.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  it('maps an AppError to its httpStatus + standard body', () => {
    const { res, status, json } = mockRes();
    errorHandler(new NotFoundError('nope'), req, res, next);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: { code: ErrorCode.NOT_FOUND, message: 'nope', correlationId: 'corr-1' },
    });
  });

  it('includes details when the AppError carries them', () => {
    const { res, json } = mockRes();
    errorHandler(new ValidationError('bad', { sku: ['required'] }), req, res, next);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'bad',
        details: { sku: ['required'] },
        correlationId: 'corr-1',
      },
    });
  });

  it('maps an unknown error to a generic 500 INTERNAL_ERROR without leaking the message', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { res, status, json } = mockRes();
    errorHandler(new Error('db password leaked here'), req, res, next);
    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(body.error.message).toBe('Something went wrong. Please try again.');
    expect(JSON.stringify(body)).not.toContain('db password leaked here');
    spy.mockRestore();
  });

  it('falls back to "unknown" correlationId when the request has none', () => {
    const { res, json } = mockRes();
    errorHandler(new NotFoundError(), {} as Request, res, next);
    expect(json.mock.calls[0][0].error.correlationId).toBe('unknown');
  });
});
