/**
 * JWT sign/verify utilities (Q3=A — 8h default TTL, configurable). Tokens carry sub (user id),
 * a unique jti, iat, and exp. Verification checks signature + expiry (BL-3 step 2).
 */
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from '../../config/env';

export interface AccessTokenClaims {
  /** Subject — the user id. */
  sub: string;
  /** Unique token id — used by the denylist. */
  jti: string;
  /** Issued-at (seconds since epoch). */
  iat: number;
  /** Expiry (seconds since epoch). */
  exp: number;
}

export interface SignedToken {
  token: string;
  jti: string;
  /** Natural expiry as a Date — stored on the denylist at logout. */
  expiresAt: Date;
}

/** Sign a fresh access token for the given user id. The JWT subject is always a string (RFC 7519). */
export function signAccessToken(userId: number): SignedToken {
  const config = loadConfig();
  const jti = uuidv4();
  const token = jwt.sign({}, config.jwtSecret, {
    subject: String(userId),
    jwtid: jti,
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);

  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date();
  return { token, jti, expiresAt };
}

/**
 * Verify signature + expiry and return the claims. Throws (jsonwebtoken error) on any failure;
 * callers translate that into UNAUTHORIZED.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
  const config = loadConfig();
  const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  return {
    sub: String(payload.sub),
    jti: String(payload.jti),
    iat: Number(payload.iat),
    exp: Number(payload.exp),
  };
}
