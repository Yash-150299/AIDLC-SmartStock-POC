/**
 * Attach a correlation id to each request and echo it on the response (error-standards.md).
 * Reuses an inbound `X-Correlation-Id` header when present; otherwise generates one.
 */
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header('X-Correlation-Id');
  const id = inbound && inbound.trim().length > 0 ? inbound.trim() : uuidv4();
  req.correlationId = id;
  res.setHeader('X-Correlation-Id', id);
  next();
}
