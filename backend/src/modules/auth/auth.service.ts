/**
 * AuthService (BL-1/BL-2/BL-3, BR-14/BR-16/BR-17).
 * - login: look up by identifier, compare bcrypt hash, issue JWT. Uniform INVALID_CREDENTIALS.
 * - logout: denylist the token's jti (idempotent).
 * - resolveUser: reject denylisted jti; return the safe UserDto.
 */
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import type { LoginRequest, LoginResponse, UserDto } from '@smartstock/shared';
import { InvalidCredentialsError, UnauthorizedError } from '../../errors/app-errors';
import { authRepository } from './auth.repository';
import { signAccessToken } from './token';

function toUserDto(user: Pick<User, 'id' | 'username' | 'email'>): UserDto {
  return { id: user.id, username: user.username, email: user.email };
}

export const authService = {
  /** BL-1: authenticate and issue an access token. */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const identifier = request.identifier.trim();
    const user = await authRepository.findByIdentifier(identifier);

    // BR-16/BR-17: same error for unknown-user and wrong-password; compare hash only.
    // Run the compare even when no user is found to reduce timing signal.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const passwordMatches = await bcrypt.compare(request.password, hash);

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const { token } = signAccessToken(user.id);
    return { token, user: toUserDto(user) };
  },

  /** BL-2: denylist the caller's token (idempotent — BR-14). */
  async logout(jti: string, expiresAt: Date): Promise<void> {
    await authRepository.denylistToken(jti, expiresAt);
  },

  /**
   * BL-3 steps 3-4: reject a denylisted jti, otherwise resolve and return the UserDto.
   * Called after signature+expiry have already been verified.
   */
  async resolveUser(userId: string, jti: string): Promise<UserDto> {
    if (await authRepository.isDenylisted(jti)) {
      throw new UnauthorizedError('Your session is no longer valid. Please sign in again.');
    }
    // The JWT subject is a string (RFC 7519); the user PK is an integer.
    const numericId = Number(userId);
    if (!Number.isInteger(numericId)) {
      throw new UnauthorizedError();
    }
    const user = await authRepository.findById(numericId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return toUserDto(user);
  },
};
