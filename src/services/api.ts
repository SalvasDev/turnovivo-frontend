import type {
  AdminUser,
  ApiMessage,
  AppointmentSlot,
  BookResponse,
  Business,
  BusinessAdmin,
  LoginResponse,
  RegisteredUser,
} from '@/types';
import {
  parseAccessToken,
  parseAdminUser,
  parseAdminUsers,
  parseBookResponse,
  parseBusiness,
  parseBusinessAdmins,
  parseMessage,
  parseSlots,
  parseUser,
} from './api-parsers';
import { httpRequest, requireValid } from './http-client';

export {
  ApiError,
  createSessionExpiredLoginUrl,
  getErrorMessage,
  INVALID_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  redirectToLoginAfterSessionExpiry,
} from './http-client';
export type { ApiMessage, BookResponse, LoginResponse, RegisteredUser } from '@/types';

/** Server components authenticate with the cookie value they read; the browser uses its session. */
export type SessionOptions = { auth: true } | { token: string };

export interface BusinessInput {
  id?: string;
  name: string;
  slug: string;
  ownerId: string;
}

export const apiService = {
  async login(email: string, passwordHash: string): Promise<LoginResponse> {
    const payload = await httpRequest('/auth/login', {
      method: 'POST',
      body: { email, passwordHash },
      fallbackError: 'Unable to sign in. Please try again.',
    });
    return requireValid(parseAccessToken(payload));
  },

  async logout(): Promise<ApiMessage> {
    const payload = await httpRequest('/auth/logout', {
      method: 'POST',
      auth: true,
      ignoreUnauthorized: true,
      fallbackError: 'Unable to end the session on the server.',
    });
    return parseMessage(payload);
  },

  async registerCustomer(email: string, passwordHash: string): Promise<RegisteredUser> {
    const payload = await httpRequest('/users', {
      method: 'POST',
      body: { email, passwordHash, role: 'CUSTOMER' },
      fallbackError: 'Unable to create your account. Please try again.',
    });
    return parseUser(payload);
  },

  async getBusinessBySlug(slug: string): Promise<Business> {
    const payload = await httpRequest(`/businesses/${encodeURIComponent(slug)}`, {
      revalidate: 60,
      fallbackError: 'Unable to load the business.',
    });
    return requireValid(parseBusiness(payload));
  },

  async getAvailableSlots(businessId: string, session?: SessionOptions, signal?: AbortSignal): Promise<AppointmentSlot[]> {
    const payload = await httpRequest(`/appointments/business/${encodeURIComponent(businessId)}/available`, {
      ...session,
      cache: 'no-store',
      signal,
      fallbackError: 'Unable to load the available appointments.',
    });
    return requireValid(parseSlots(payload));
  },

  async bookAppointment(slotId: string): Promise<BookResponse> {
    const payload = await httpRequest('/appointments/book', {
      method: 'POST',
      auth: true,
      body: { slotId },
      fallbackError: 'Unable to book this appointment.',
    });
    return parseBookResponse(payload);
  },

  async joinWaitlist(slotId: string): Promise<ApiMessage> {
    const payload = await httpRequest('/appointments/waitlist/join', {
      method: 'POST',
      auth: true,
      body: { slotId },
      fallbackError: 'Unable to join the waitlist.',
    });
    return parseMessage(payload);
  },

  async cancelAppointment(appointmentId: string): Promise<ApiMessage> {
    const payload = await httpRequest(`/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST',
      auth: true,
      fallbackError: 'Unable to cancel the appointment.',
    });
    return parseMessage(payload);
  },

  async leaveWaitlist(slotId: string): Promise<ApiMessage> {
    const payload = await httpRequest(`/appointments/slots/${encodeURIComponent(slotId)}/leave-waitlist`, {
      method: 'POST',
      auth: true,
      fallbackError: 'Unable to leave the waitlist.',
    });
    return parseMessage(payload);
  },

  async confirmHold(slotId: string): Promise<ApiMessage> {
    const payload = await httpRequest(`/appointments/slots/${encodeURIComponent(slotId)}/confirm-hold`, {
      method: 'POST',
      auth: true,
      fallbackError: 'Unable to claim this appointment.',
    });
    return parseMessage(payload);
  },

  async declineHold(slotId: string): Promise<ApiMessage> {
    const payload = await httpRequest(`/appointments/slots/${encodeURIComponent(slotId)}/decline-hold`, {
      method: 'POST',
      auth: true,
      fallbackError: 'Unable to decline this appointment.',
    });
    return parseMessage(payload);
  },

  async listBusinesses(session: SessionOptions): Promise<BusinessAdmin[]> {
    const payload = await httpRequest('/businesses', {
      ...session,
      cache: 'no-store',
      fallbackError: 'Unable to load the companies.',
    });
    return requireValid(parseBusinessAdmins(payload));
  },

  async listAdmins(session: SessionOptions): Promise<AdminUser[]> {
    const payload = await httpRequest('/admin/users?role=ADMIN', {
      ...session,
      cache: 'no-store',
      fallbackError: 'Unable to load the admins.',
    });
    return requireValid(parseAdminUsers(payload));
  },

  async createAdmin(email: string, password: string): Promise<AdminUser> {
    const payload = await httpRequest('/admin/users', {
      method: 'POST',
      auth: true,
      body: { email, password },
      fallbackError: 'Unable to create the admin.',
    });
    return requireValid(parseAdminUser(payload));
  },

  async saveBusiness({ id, ...business }: BusinessInput): Promise<void> {
    await httpRequest(id ? `/businesses/${encodeURIComponent(id)}` : '/businesses', {
      method: id ? 'PUT' : 'POST',
      auth: true,
      body: business,
      fallbackError: id ? 'Unable to update the company.' : 'Unable to create the company.',
    });
  },

  async reactivateBusiness({ id, name, slug, ownerId }: BusinessAdmin): Promise<void> {
    await httpRequest(`/businesses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      auth: true,
      body: { name, slug, ownerId, active: true },
      fallbackError: 'Unable to reactivate the company.',
    });
  },

  async deactivateBusiness(id: string): Promise<void> {
    await httpRequest(`/businesses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
      fallbackError: 'Unable to deactivate the company.',
    });
  },
};
