import type {
  ApiMessage,
  AppointmentSlot,
  BookResponse,
  Business,
  LoginResponse,
  RegisteredUser,
} from '@/types';
import Cookies from 'js-cookie';
import {
  parseAccessToken,
  parseBookResponse,
  parseBusiness,
  parseMessage,
  parseSlots,
  parseUser,
  readJsonBody,
} from './api-parsers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_COOKIE = 'turnovivo_token';
let redirectingAfterExpiry = false;

export const NETWORK_ERROR_MESSAGE = 'Unable to reach the service. Check your connection and try again.';
export const INVALID_RESPONSE_MESSAGE = 'The service returned an unexpected response. Please try again.';

export type { ApiMessage, BookResponse, LoginResponse, RegisteredUser } from '@/types';

/** HTTP error that keeps the status so callers can tell "not found" apart from outages. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createSessionExpiredLoginUrl(pathname: string, search = '', hash = '') {
  const returnPath = `${pathname}${search}${hash}`;
  const safePath = returnPath.startsWith('/') && !returnPath.startsWith('//') && !returnPath.startsWith('/\\')
    ? returnPath
    : '/';
  return `/login?sessionExpired=1&next=${encodeURIComponent(safePath)}`;
}

export function redirectToLoginAfterSessionExpiry() {
  if (typeof window === 'undefined') return;
  Cookies.remove(TOKEN_COOKIE);
  if (window.location.pathname === '/login' || redirectingAfterExpiry) return;
  redirectingAfterExpiry = true;
  window.location.replace(createSessionExpiredLoginUrl(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  ));
}

/** Sends a request and returns the raw JSON body; transport and HTTP failures become ApiError. */
export async function fetchApi(path: string, init?: RequestInit, fallbackError = 'The request failed.'): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  const payload = await readJsonBody(response);

  if (!response.ok) {
    const hasAuthorization = new Headers(init?.headers).has('Authorization');
    if (response.status === 401 && hasAuthorization && path !== '/auth/logout') {
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

function withAuth(token: string, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

export const apiService = {
  async login(email: string, passwordHash: string): Promise<LoginResponse> {
    const payload = await fetchApi(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash }),
      },
      'Unable to sign in. Please try again.',
    );
    return requireValid(parseAccessToken(payload));
  },

  async logout(token: string): Promise<ApiMessage> {
    const payload = await fetchApi(
      '/auth/logout',
      withAuth(token, { method: 'POST' }),
      'Unable to end the session on the server.',
    );
    return parseMessage(payload);
  },

  async registerCustomer(email: string, passwordHash: string): Promise<RegisteredUser> {
    const payload = await fetchApi(
      '/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash, role: 'CUSTOMER' }),
      },
      'Unable to create your account. Please try again.',
    );
    return parseUser(payload);
  },

  async getBusinessBySlug(slug: string): Promise<Business> {
    const payload = await fetchApi(
      `/businesses/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } },
      'Unable to load the business.',
    );
    return requireValid(parseBusiness(payload));
  },

  async getAvailableSlots(businessId: string, token?: string): Promise<AppointmentSlot[]> {
    const init: RequestInit = token
      ? withAuth(token, { cache: 'no-store' })
      : { cache: 'no-store' };

    const payload = await fetchApi(
      `/appointments/business/${encodeURIComponent(businessId)}/available`,
      init,
      'Unable to load the available appointments.',
    );
    return requireValid(parseSlots(payload));
  },

  async bookAppointment(slotId: string, token: string): Promise<BookResponse> {
    const payload = await fetchApi(
      '/appointments/book',
      withAuth(token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      }),
      'Unable to book this appointment.',
    );
    return parseBookResponse(payload);
  },

  async joinWaitlist(slotId: string, token: string): Promise<ApiMessage> {
    const payload = await fetchApi(
      '/appointments/waitlist/join',
      withAuth(token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      }),
      'Unable to join the waitlist.',
    );
    return parseMessage(payload);
  },

  async cancelAppointment(appointmentId: string, token: string): Promise<ApiMessage> {
    const payload = await fetchApi(
      `/appointments/${encodeURIComponent(appointmentId)}/cancel`,
      withAuth(token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
      'Unable to cancel the appointment.',
    );
    return parseMessage(payload);
  },

  async leaveWaitlist(slotId: string, token: string): Promise<ApiMessage> {
    const payload = await fetchApi(
      `/appointments/slots/${encodeURIComponent(slotId)}/leave-waitlist`,
      withAuth(token, { method: 'POST' }),
      'Unable to leave the waitlist.',
    );
    return parseMessage(payload);
  },

  async confirmHold(slotId: string, token: string): Promise<ApiMessage> {
    const payload = await fetchApi(
      `/appointments/slots/${encodeURIComponent(slotId)}/confirm-hold`,
      withAuth(token, { method: 'POST' }),
      'Unable to claim this appointment.',
    );
    return parseMessage(payload);
  },

  async declineHold(slotId: string, token: string): Promise<ApiMessage> {
    const payload = await fetchApi(
      `/appointments/slots/${encodeURIComponent(slotId)}/decline-hold`,
      withAuth(token, { method: 'POST' }),
      'Unable to decline this appointment.',
    );
    return parseMessage(payload);
  },
};
