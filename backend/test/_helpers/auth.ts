/**
 * Helper for API suites that exercise protected routes. requireAuth -> authService.resolveUser ->
 * authRepository.isDenylisted + findById. A suite jest.mock's auth.repository, then calls
 * wireAuthedUser(mock) and uses bearerToken() so the real verify + resolve path succeeds.
 */
import { signAccessToken } from '../../src/modules/auth/token';
import { makeUserRow, type UserRow } from './fixtures';

export function bearerToken(userId = 1): string {
  return `Bearer ${signAccessToken(userId).token}`;
}

/** Configure a mocked authRepository so any valid (non-denylisted) token resolves to `user`. */
export function wireAuthedUser(
  repo: { isDenylisted: jest.Mock; findById: jest.Mock },
  user: UserRow = makeUserRow(),
): UserRow {
  repo.isDenylisted.mockResolvedValue(false);
  repo.findById.mockResolvedValue(user as never);
  return user;
}
