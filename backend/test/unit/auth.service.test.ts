/**
 * AuthService (BL-1/BL-2/BL-3, BR-14/16/17, NFR-2). Repository mocked; real bcryptjs + real JWT.
 */
jest.mock('../../src/modules/auth/auth.repository', () => ({
  authRepository: {
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    denylistToken: jest.fn(),
    isDenylisted: jest.fn(),
    purgeExpired: jest.fn(),
  },
}));

import { authService } from '../../src/modules/auth/auth.service';
import { authRepository } from '../../src/modules/auth/auth.repository';
import { verifyAccessToken } from '../../src/modules/auth/token';
import { InvalidCredentialsError, UnauthorizedError } from '../../src/errors/app-errors';
import { KNOWN_PASSWORD, makeUserRow } from '../_helpers/fixtures';

const repo = authRepository as jest.Mocked<typeof authRepository>;

describe('authService.login (BL-1)', () => {
  it('issues a token and a safe UserDto on correct credentials', async () => {
    const user = makeUserRow();
    repo.findByIdentifier.mockResolvedValue(user as never);

    const result = await authService.login({ identifier: 'alice', password: KNOWN_PASSWORD });

    expect(repo.findByIdentifier).toHaveBeenCalledWith('alice');
    expect(result.user).toEqual({ id: user.id, username: user.username, email: user.email });
    // NFR-2: passwordHash never crosses the boundary.
    expect(result.user as Record<string, unknown>).not.toHaveProperty('passwordHash');
    // The token is a real, verifiable JWT for this user.
    expect(verifyAccessToken(result.token).sub).toBe(String(user.id));
  });

  it('trims the identifier before lookup', async () => {
    repo.findByIdentifier.mockResolvedValue(makeUserRow() as never);
    await authService.login({ identifier: '  alice  ', password: KNOWN_PASSWORD });
    expect(repo.findByIdentifier).toHaveBeenCalledWith('alice');
  });

  it('throws uniform INVALID_CREDENTIALS for a wrong password (BR-16/17)', async () => {
    repo.findByIdentifier.mockResolvedValue(makeUserRow() as never);
    await expect(authService.login({ identifier: 'alice', password: 'wrong' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('throws the SAME INVALID_CREDENTIALS for an unknown user (no user enumeration)', async () => {
    repo.findByIdentifier.mockResolvedValue(null);
    await expect(
      authService.login({ identifier: 'ghost', password: KNOWN_PASSWORD }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});

describe('authService.logout (BL-2, BR-14)', () => {
  it('denylists the jti with its expiry', async () => {
    repo.denylistToken.mockResolvedValue(undefined as never);
    const exp = new Date('2030-01-01T00:00:00.000Z');
    await authService.logout('jti-1', exp);
    expect(repo.denylistToken).toHaveBeenCalledWith('jti-1', exp);
  });
});

describe('authService.resolveUser (BL-3 steps 3-4)', () => {
  it('rejects a denylisted jti with UnauthorizedError', async () => {
    repo.isDenylisted.mockResolvedValue(true);
    await expect(authService.resolveUser('1', 'jti-x')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('rejects when the user no longer exists', async () => {
    repo.isDenylisted.mockResolvedValue(false);
    repo.findById.mockResolvedValue(null);
    await expect(authService.resolveUser('999', 'jti-y')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returns the safe UserDto for a valid, non-denylisted token', async () => {
    repo.isDenylisted.mockResolvedValue(false);
    const user = makeUserRow();
    repo.findById.mockResolvedValue(user as never);
    const dto = await authService.resolveUser(String(user.id), 'jti-z');
    expect(dto).toEqual({ id: user.id, username: user.username, email: user.email });
    expect(dto as Record<string, unknown>).not.toHaveProperty('passwordHash');
  });
});
