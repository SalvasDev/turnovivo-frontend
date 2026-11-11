import Cookies from 'js-cookie';

export const TOKEN_COOKIE = 'turnovivo_token';

/** Browser-side session token; server code reads the same cookie through next/headers. */
export function getSessionToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE) || undefined;
}

export function hasSessionToken() {
  return getSessionToken() !== undefined;
}

export function setSessionToken(token: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  Cookies.set(TOKEN_COOKIE, token, { expires: 1, secure, sameSite: 'strict' });
}

export function clearSessionToken() {
  Cookies.remove(TOKEN_COOKIE);
}
