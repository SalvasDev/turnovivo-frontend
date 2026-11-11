'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { apiService } from '@/services/api';
import { parseTokenClaims } from '@/services/api-parsers';

const TOKEN_COOKIE = 'turnovivo_token';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  clearSession: () => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The cookie is the source of truth; subscribers re-read it whenever login/logout changes it.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const notify = () => listeners.forEach((listener) => listener());
const getTokenSnapshot = () => Cookies.get(TOKEN_COOKIE) ?? null;
// Undefined on the server marks the session as unknown until the client hydrates.
const getServerTokenSnapshot = () => undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getTokenSnapshot, getServerTokenSnapshot);
  const loggingOutRef = useRef(false);
  const loading = snapshot === undefined;
  const token = snapshot ?? null;

  const user = useMemo<User | null>(() => {
    const claims = token ? parseTokenClaims(token) : null;
    return claims ? { id: claims.sub, email: claims.email, role: claims.role } : null;
  }, [token]);

  const login = useCallback((newToken: string) => {
    const isHttps = window.location.protocol === 'https:';
    Cookies.set(TOKEN_COOKIE, newToken, { expires: 1, secure: isHttps, sameSite: 'strict' });
    notify();
  }, []);

  const clearSession = useCallback(() => {
    Cookies.remove(TOKEN_COOKIE);
    notify();
  }, []);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    const currentToken = Cookies.get(TOKEN_COOKIE);
    if (currentToken) {
      // The local session is cleared even if the server cannot be notified.
      await apiService.logout(currentToken).catch(() => undefined);
    }
    clearSession();
    window.location.assign('/login');
  }, [clearSession]);

  const value = useMemo(() => ({ user, token, login, clearSession, logout, loading }), [user, token, login, clearSession, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
