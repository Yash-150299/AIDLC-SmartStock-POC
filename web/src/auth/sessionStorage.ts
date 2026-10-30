/**
 * Typed per-tab sessionStorage access for the auth token + user (BR-W1).
 * This is the single place the API client and AuthContext read the current token from,
 * so a page refresh within the same tab keeps the session alive while a new tab starts clean.
 */
import type { UserDto } from '@smartstock/shared';

const TOKEN_KEY = 'smartstock.token';
const USER_KEY = 'smartstock.user';

export interface StoredSession {
  token: string;
  user: UserDto;
}

/** Read the persisted session for this tab, or null when absent/corrupt. */
export function readSession(): StoredSession | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const userRaw = sessionStorage.getItem(USER_KEY);
    if (!token || !userRaw) {
      return null;
    }
    const user = JSON.parse(userRaw) as UserDto;
    return { token, user };
  } catch {
    return null;
  }
}

/** Read just the bearer token for this tab (used by the request interceptor). */
export function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

/** Persist the session for this tab. */
export function writeSession(session: StoredSession): void {
  sessionStorage.setItem(TOKEN_KEY, session.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

/** Clear the persisted session for this tab. */
export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
