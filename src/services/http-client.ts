import { getSafeReturnPath } from '@/domain/access';
import { parseMessage, readJsonBody } from './api-parsers';
import { clearSessionToken, getSessionToken } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
let redirectingAfterExpiry = false;

export const NETWORK_ERROR_MESSAGE = 'Unable to reach the service. Check your connection and try again.';
export const INVALID_RESPONSE_MESSAGE = 'The service returned an unexpected response. Please try again.';
export const SIGN_IN_REQUIRED_MESSAGE = 'Sign in to continue.';

/** HTTP error that keeps the status so callers can tell "not found" apart from outages. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createSessionExpiredLoginUrl(pathname: string, search = '', hash = '') {
  const safePath = getSafeReturnPath(`${pathname}${search}${hash}`) ?? '/';
  return `/login?sessionExpired=1&next=${encodeURIComponent(safePath)}`;
}

export function redirectToLoginAfterSessionExpiry() {
  if (typeof window === 'undefined') return;
  clearSessionToken();
  if (window.location.pathname === '/login' || redirectingAfterExpiry) return;
  redirectingAfterExpiry = true;
  window.location.replace(createSessionExpiredLoginUrl(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  ));
}

/** `auth` uses the browser session; server components pass `token` because they can't read browser cookies. */
export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  token?: string;
  cache?: RequestCache;
  revalidate?: number;
  /** Skips the session-expiry redirect, e.g. for logout. */
  ignoreUnauthorized?: boolean;
  signal?: AbortSignal;
  fallbackError?: string;
}

/** The app's only HTTP client: token, transport errors and HTTP errors are handled here. */
export async function httpRequest(path: string, options: HttpRequestOptions = {}): Promise<unknown> {
  const { method = 'GET', body, auth, cache, revalidate, ignoreUnauthorized, signal, fallbackError = 'The request failed.' } = options;
  const token = options.token ?? (auth ? getSessionToken() : undefined);
  if (auth && !token) throw new ApiError(SIGN_IN_REQUIRED_MESSAGE, 401);

  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const init: RequestInit = { method, headers, cache, signal };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (revalidate !== undefined) init.next = { revalidate };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch (error) {
    // A cancelled request is not an outage; callers recognize it with isAbortError.
    if (signal?.aborted) throw error;
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  const payload = await readJsonBody(response);

  if (!response.ok) {
    if (response.status === 401 && token && !ignoreUnauthorized) {
      redirectToLoginAfterSessionExpiry();
    }
    throw new ApiError(parseMessage(payload).message ?? fallbackError, response.status);
  }

  return payload;
}

/** Rejects a response whose shape the UI can't render. */
export function requireValid<T>(value: T | null): T {
  if (value === null) throw new ApiError(INVALID_RESPONSE_MESSAGE, 502);
  return value;
}

export function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export const isAbortError = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';
