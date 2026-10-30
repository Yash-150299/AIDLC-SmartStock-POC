/**
 * Client-owned session state (DB-W1). Holds `{ token, user }` in React Context, mirrored to
 * per-tab sessionStorage (BR-W1). The httpClient reads the live token from sessionStorage; this
 * context drives route guarding and the authenticated shell.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UserDto } from '@smartstock/shared';
import { clearSession, readSession, writeSession } from './sessionStorage';

export interface AuthState {
  token: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  /** Record a successful login into context + sessionStorage. */
  login: (token: string, user: UserDto) => void;
  /** Clear local session (used on logout and on session-expiry redirect). */
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => readSession());

  const login = useCallback((token: string, user: UserDto) => {
    writeSession({ token, user });
    setSession({ token, user });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth session. Throws if used outside the provider. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
