/**
 * requireAuth middleware (BL-3, NFR-3). Order: extract bearer -> verify signature/expiry FIRST ->
 * denylist/resolve. Any failure -> UnauthorizedError (401). authService is mocked; token signing is
 * real so the verify step genuinely runs.
 */
import type { NextFunction, Request, Response } from 'express';

jest.mock('../../src/modules/auth/auth.service', () => ({
  authService: { resolveUser: jest.fn() },
}));

import { requireAuth } from '../../src/middleware/auth';
import { authService } from '../../src/modules/auth/auth.service';
import { signAccessToken } from '../../src/modules/auth/token';
import { UnauthorizedError } from '../../src/errors/app-errors';

const resolveUser = authService.resolveUser as jest.Mock;

function reqWith(authHeader?: string): Request {
  return {
    header: jest.fn((name: string) => (name === 'Authorization' ? authHeader : undefined)),
  } as unknown as Request;
}

const res = {} as Response;

describe('requireAuth', () => {
  it('rejects a missing Authorization header with 401 and does not touch the service', async () => {
    const next = jest.fn() as unknown as NextFunction & jest.Mock;
    await requireAuth(reqWith(undefined), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(resolveUser).not.toHaveBeenCalled();
  });

  it('rejects a non-bearer scheme with 401', async () => {
    const next = jest.fn() as unknown as NextFunction & jest.Mock;
    await requireAuth(reqWith('Basic abc'), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it('rejects an invalid token BEFORE any denylist lookup (verify-first order)', async () => {
    const next = jest.fn() as unknown as NextFunction & jest.Mock;
    await requireAuth(reqWith('Bearer not-a-real-token'), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(resolveUser).not.toHaveBeenCalled(); // never consulted for an invalid token
  });

  it('attaches the resolved user + claims and calls next() on success', async () => {
    const user = { id: 1, username: 'alice', email: 'a@x.com' };
    resolveUser.mockResolvedValue(user);
    const { token, jti } = signAccessToken(1);
    const req = reqWith(`Bearer ${token}`);
    const next = jest.fn() as unknown as NextFunction & jest.Mock;

    await requireAuth(req, res, next);

    // The JWT subject is always a string (RFC 7519), so resolveUser receives the stringified id.
    expect(resolveUser).toHaveBeenCalledWith('1', jti);
    expect(req.user).toEqual(user);
    expect(req.tokenClaims?.sub).toBe('1');
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it('propagates an UnauthorizedError thrown by resolveUser (denylisted jti)', async () => {
    resolveUser.mockRejectedValue(new UnauthorizedError('denylisted'));
    const { token } = signAccessToken(1);
    const next = jest.fn() as unknown as NextFunction & jest.Mock;
    await requireAuth(reqWith(`Bearer ${token}`), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});
