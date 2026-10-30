/**
 * JWT sign/verify (BL-3 step 2, FR-38) — real jsonwebtoken with the test JWT_SECRET.
 */
import jwt from 'jsonwebtoken';
import { signAccessToken, verifyAccessToken } from '../../src/modules/auth/token';

describe('signAccessToken / verifyAccessToken', () => {
  it('signs a token carrying sub + unique jti and a future expiry', () => {
    const signed = signAccessToken('user-42');
    expect(typeof signed.token).toBe('string');
    expect(signed.jti).toHaveLength(36); // uuid v4
    expect(signed.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const claims = verifyAccessToken(signed.token);
    expect(claims.sub).toBe('user-42');
    expect(claims.jti).toBe(signed.jti);
    expect(claims.exp).toBeGreaterThan(claims.iat);
  });

  it('produces a distinct jti per call', () => {
    const a = signAccessToken('u');
    const b = signAccessToken('u');
    expect(a.jti).not.toBe(b.jti);
  });

  it('verifyAccessToken throws on a tampered/invalid signature', () => {
    const { token } = signAccessToken(1);
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'bb' : 'aa');
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('verifyAccessToken throws on a token signed with a different secret', () => {
    const foreign = jwt.sign({}, 'some-other-secret', { subject: 'x', jwtid: 'j', expiresIn: '1h' });
    expect(() => verifyAccessToken(foreign)).toThrow();
  });

  it('verifyAccessToken throws on an expired token', () => {
    const expired = jwt.sign({}, process.env.JWT_SECRET as string, {
      subject: 'x',
      jwtid: 'j',
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(expired)).toThrow();
  });
});
