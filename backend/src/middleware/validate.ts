/**
 * Generic zod validation middleware (Q5=A). Validates request body/query/params against the given
 * schemas and, on success, replaces each part with the parsed (coerced) value. On failure throws a
 * ValidationError (400) carrying field-level details — always before any business rule (BR-1/BR-10).
 */
import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ValidationError } from '../errors/app-errors';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatIssues(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        // Express 4 query is a getter-only in some setups; assign via Object.defineProperty-safe cast.
        (req as { query: unknown }).query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Please check the highlighted fields and try again.', formatIssues(err)));
        return;
      }
      next(err);
    }
  };
}
