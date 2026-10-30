/**
 * correlationId middleware — reuse inbound header when present, otherwise generate; echo on response.
 */
import type { Request, Response } from 'express';
import { correlationId } from '../../src/middleware/correlation-id';

function mockReqRes(header?: string) {
  const req = {
    header: jest.fn((name: string) => (name === 'X-Correlation-Id' ? header : undefined)),
  } as unknown as Request;
  const setHeader = jest.fn();
  const res = { setHeader } as unknown as Response;
  return { req, res, setHeader };
}

describe('correlationId middleware', () => {
  it('reuses a non-blank inbound X-Correlation-Id (trimmed)', () => {
    const { req, res, setHeader } = mockReqRes('  abc-123  ');
    const next = jest.fn();
    correlationId(req, res, next);
    expect(req.correlationId).toBe('abc-123');
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'abc-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a uuid when no inbound header', () => {
    const { req, res, setHeader } = mockReqRes(undefined);
    const next = jest.fn();
    correlationId(req, res, next);
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id', req.correlationId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a uuid when inbound header is blank', () => {
    const { req, res, setHeader } = mockReqRes('   ');
    const next = jest.fn();
    correlationId(req, res, next);
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id', req.correlationId);
  });
});
