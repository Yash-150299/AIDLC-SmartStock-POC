/**
 * AuthMiddleware (BL-3, FR-38, NFR-3). Order of checks:
 *   1. Extract bearer token.
 *   2. Verify signature + expiry FIRST (no denylist lookup for already-invalid tokens).
 *   3. Check the denylist for the jti.
 *   4. Attach the resolved UserDto to the request.
 * Any failure -> UnauthorizedError (401).
 */
import type { NextFunction, Request, Response } from 'express';
import type { UserDto } from '@smartstock/shared';
import { UnauthorizedError } from '../errors/app-errors';
import { authService } from '../modules/auth/auth.service';
import { verifyAccessToken, type AccessTokenClaims } from '../modules/auth/token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDto;
      tokenClaims?: AccessTokenClaims;
    }
  }
}

function extractBearer(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearer(req.header('Authorization'));
    if (!token) {
      throw new UnauthorizedError();
    }

    let claims: AccessTokenClaims;
    try {
      claims = verifyAccessToken(token); // signature + expiry first (BL-3 step 2)
    } catch {
      throw new UnauthorizedError();
    }

    const user = await authService.resolveUser(claims.sub, claims.jti); // denylist + resolve
    req.user = user;
    req.tokenClaims = claims;
    next();
  } catch (err) {
    next(err);
  }
}
