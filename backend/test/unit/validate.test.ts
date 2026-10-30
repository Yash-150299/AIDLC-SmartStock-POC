/**
 * validate middleware — zod parse of body/query/params, coercion, and ValidationError(400) with
 * field-level details on failure (BR-1/BR-10).
 */
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate';
import { ValidationError } from '../../src/errors/app-errors';

function run(schemas: Parameters<typeof validate>[0], req: Partial<Request>) {
  const next = jest.fn() as unknown as NextFunction;
  const mw = validate(schemas);
  mw(req as Request, {} as Response, next);
  return next as unknown as jest.Mock;
}

describe('validate middleware', () => {
  it('passes and replaces body with the parsed value on success', () => {
    const req: Partial<Request> = { body: { name: ' x ', keep: 1 } };
    const next = run({ body: z.object({ name: z.string().trim(), keep: z.number() }) }, req);
    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.body).toEqual({ name: 'x', keep: 1 }); // trimmed/coerced
  });

  it('coerces query params (string -> number)', () => {
    const req: Partial<Request> = { query: { page: '3' } as never };
    const next = run({ query: z.object({ page: z.coerce.number().int() }) }, req);
    expect(next).toHaveBeenCalledWith();
    expect((req.query as { page: number }).page).toBe(3);
  });

  it('calls next with a ValidationError(400) carrying field details on failure', () => {
    const req: Partial<Request> = { body: { name: '' } };
    const next = run({ body: z.object({ name: z.string().min(1, 'required') }) }, req);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.httpStatus).toBe(400);
    expect(err.details).toEqual({ name: ['required'] });
  });

  it('validates params then query then body; param failure short-circuits', () => {
    const req: Partial<Request> = { params: { id: '' } as never, body: { ok: true } };
    const next = run(
      {
        params: z.object({ id: z.string().min(1, 'id required') }),
        body: z.object({ ok: z.boolean() }),
      },
      req,
    );
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.details).toEqual({ id: ['id required'] });
  });

  it('rethrows a non-zod error unchanged', () => {
    const boom = new Error('boom');
    const throwing = { parse: () => { throw boom; } } as unknown as z.ZodTypeAny;
    const next = run({ body: throwing }, { body: {} });
    expect(next).toHaveBeenCalledWith(boom);
  });
});
