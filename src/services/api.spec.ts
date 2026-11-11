import { afterEach, describe, expect, it, vi } from 'vitest';
import Cookies from 'js-cookie';
import {
  apiService,
  createSessionExpiredLoginUrl,
  INVALID_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from './api';

describe('createSessionExpiredLoginUrl', () => {
  it('preserves the current route, query and hash as a safe return path', () => {
    expect(createSessionExpiredLoginUrl('/admin', '?tab=slots', '#today'))
      .toBe('/login?sessionExpired=1&next=%2Fadmin%3Ftab%3Dslots%23today');
  });

  it.each(['//evil.example', '/\\evil.example'])('rejects an external return path: %s', (path) => {
    expect(createSessionExpiredLoginUrl(path)).toBe('/login?sessionExpired=1&next=%2F');
  });

  it('clears the token and redirects authenticated 401 responses with return context', async () => {
    const replace = vi.fn();
    Cookies.set('turnovivo_token', 'expired-token');
    vi.stubGlobal('window', {
      location: { pathname: '/barberia-premium', search: '?date=2026-11-13', hash: '#slots', replace },
    } as unknown as Window);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: 'Session expired' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )));

    try {
      await expect(apiService.bookAppointment('slot-1', 'expired-token'))
        .rejects.toMatchObject({ status: 401 });
      expect(Cookies.get('turnovivo_token')).toBeUndefined();
      expect(replace).toHaveBeenCalledWith(
        '/login?sessionExpired=1&next=%2Fbarberia-premium%3Fdate%3D2026-11-13%23slots',
      );
    } finally {
      vi.unstubAllGlobals();
      Cookies.remove('turnovivo_token');
    }
  });
});

describe('apiService resilience', () => {
  const respond = (body: string, init: ResponseInit = {}) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(body, { headers: { 'Content-Type': 'application/json' }, ...init }),
  ));

  afterEach(() => { vi.unstubAllGlobals(); });

  it('turns a network failure into a readable ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiService.getAvailableSlots('biz-1'))
      .rejects.toMatchObject({ name: 'ApiError', status: 0, message: NETWORK_ERROR_MESSAGE });
  });

  it('keeps the status and fallback message when the error body is malformed', async () => {
    respond('<html>Bad gateway', { status: 502 });
    await expect(apiService.getBusinessBySlug('demo'))
      .rejects.toMatchObject({ status: 502, message: 'Unable to load the business.' });
  });

  it.each([
    ['an object', '{"data":[]}'],
    ['null', 'null'],
    ['malformed JSON', '[{"id":'],
  ])('rejects slots returned as %s instead of rendering them', async (_label, body) => {
    respond(body);
    await expect(apiService.getAvailableSlots('biz-1'))
      .rejects.toMatchObject({ status: 502, message: INVALID_RESPONSE_MESSAGE });
  });

  it('drops malformed slots and normalizes optional collections', async () => {
    respond(JSON.stringify([
      { id: 'ok', startTime: '2026-11-12T10:00:00Z', endTime: '2026-11-12T10:30:00Z', status: 'AVAILABLE', waitlistEntries: 'x' },
      { id: 'bad-date', startTime: 'not-a-date', endTime: '2026-11-12T10:30:00Z', status: 'AVAILABLE' },
      { id: 'bad-status', startTime: '2026-11-12T10:00:00Z', endTime: '2026-11-12T10:30:00Z', status: 'UNKNOWN' },
      null,
    ]));

    const slots = await apiService.getAvailableSlots('biz-1');
    expect(slots.map(slot => slot.id)).toEqual(['ok']);
    expect(slots[0]).toMatchObject({ appointment: null, waitlistEntries: [], slotBlocks: [] });
  });

  it('rejects a login response without a token', async () => {
    respond('{}');
    await expect(apiService.login('a@b.co', 'secret123')).rejects.toMatchObject({ status: 502 });
  });

  it('accepts an empty body for message endpoints', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiService.cancelAppointment('app-1', 'token')).resolves.toEqual({});
  });
});