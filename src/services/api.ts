import { AppointmentSlot, Business } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiErrorPayload {
  message?: string | string[];
}

type ExtendedRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function buildMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload?.message) {
    return fallback;
  }
  return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
}

async function request<T>(path: string, init?: ExtendedRequestInit, fallbackError = 'Error en la petición.'): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = (isJson ? await response.json() : null) as T | ApiErrorPayload | null;

  if (!response.ok) {
    throw new Error(buildMessage(payload as ApiErrorPayload | null, fallbackError));
  }

  return payload as T;
}

function withAuth(token: string, init?: ExtendedRequestInit): ExtendedRequestInit {
  return {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

export interface LoginResponse {
  accessToken: string;
}

export interface ApiMessage {
  message?: string;
}

export interface BookResponse extends ApiMessage {
  id: string;
  customerId: string;
}

export const apiService = {
  async login(email: string, passwordHash: string): Promise<LoginResponse> {
    return request<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash }),
      },
      'Error al iniciar sesión.',
    );
  },

  async logout(token: string): Promise<ApiMessage> {
    return request<ApiMessage>(
      '/auth/logout',
      withAuth(token, {
        method: 'POST',
      }),
      'No se pudo cerrar la sesión en el servidor.',
    );
  },

  async registerCustomer(email: string, passwordHash: string): Promise<{ id: string; email: string; role: string }> {
    return request<{ id: string; email: string; role: string }>(
      '/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash, role: 'CUSTOMER' }),
      },
      'Error al procesar el registro.',
    );
  },

  async getBusinessBySlug(slug: string): Promise<Business> {
    return request<Business>(
      `/businesses/${slug}`,
      {
        next: { revalidate: 60 },
      },
      'Error al cargar el negocio.',
    );
  },

  async getAvailableSlots(businessId: string, token?: string): Promise<AppointmentSlot[]> {
    const init = token
      ? withAuth(token, { cache: 'no-store' })
      : ({ cache: 'no-store' } as ExtendedRequestInit);

    return request<AppointmentSlot[]>(
      `/appointments/business/${businessId}/available`,
      init,
      'Error al cargar la agenda de turnos disponibles.',
    );
  },

  async bookAppointment(slotId: string, token: string): Promise<BookResponse> {
    return request<BookResponse>(
      '/appointments/book',
      withAuth(token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      }),
      'Hubo un problema en la transaccion.',
    );
  },

  async joinWaitlist(slotId: string, token: string): Promise<ApiMessage> {
    return request<ApiMessage>(
      '/appointments/waitlist/join',
      withAuth(token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      }),
      'Hubo un problema en la transaccion.',
    );
  },

  async cancelAppointment(appointmentId: string, token: string): Promise<ApiMessage> {
    return request<ApiMessage>(
      `/appointments/${appointmentId}/cancel`,
      withAuth(token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
      'Error al cancelar.',
    );
  },

  async leaveWaitlist(slotId: string, token: string): Promise<ApiMessage> {
    return request<ApiMessage>(
      `/appointments/slots/${slotId}/leave-waitlist`,
      withAuth(token, {
        method: 'POST',
      }),
      'Error al salir de la lista.',
    );
  },

  async confirmHold(slotId: string, token: string): Promise<ApiMessage> {
    return request<ApiMessage>(
      `/appointments/slots/${slotId}/confirm-hold`,
      withAuth(token, {
        method: 'POST',
      }),
      'No se pudo reclamar el turno.',
    );
  },

  async declineHold(slotId: string, token: string): Promise<ApiMessage> {
    return request<ApiMessage>(
      `/appointments/slots/${slotId}/decline-hold`,
      withAuth(token, {
        method: 'POST',
      }),
      'No se pudo rechazar el turno.',
    );
  },
};
