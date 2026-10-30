/**
 * Terminal Express error middleware (error-standards.md, FR-39). Maps AppError instances to the
 * standard response shape; any unknown error becomes a generic 500 INTERNAL_ERROR with no leaked
 * internals. The correlation id is included for tracing.
 */
import type { NextFunction, Request, Response } from 'express';
import { ErrorCode, type ErrorResponse } from '@smartstock/shared';
import { AppError } from '../errors/app-errors';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const correlationId = req.correlationId ?? 'unknown';

  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
        correlationId,
      },
    };
    res.status(err.httpStatus).json(body);
    return;
  }

  // Unknown/unexpected error — log server-side, return a safe generic response.
  // eslint-disable-next-line no-console
  console.error(`[${correlationId}] Unhandled error:`, err);

  const body: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Something went wrong. Please try again.',
      correlationId,
    },
  };
  res.status(500).json(body);
}
