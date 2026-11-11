import { describe, expect, it } from 'vitest';
import type { AppointmentSlot } from '@/types';
import { getHomePathForRole, getSafeReturnPath } from './access';
import { formatDuration, formatLongDate, formatTime, getDateKey } from './format';
import { getBlockReason, getDayAvailability, getUpcomingSlots, hasStarted, isActiveBookingFor } from './slots';
import { getPasswordError, getServerErrorField } from './validation';

const slot = (overrides: Partial<AppointmentSlot> = {}): AppointmentSlot => ({
  id: 'slot-1', businessId: 'biz', staffId: 'staff', status: 'AVAILABLE',
  startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
  appointment: null, waitlistEntries: [], slotBlocks: [], ...overrides,
});

describe('slot rules', () => {
  it('prefers the server block reason over the optimistic local one', () => {
    const blocked = slot({ slotBlocks: [{ customerId: 'me', reason: 'EXPIRED' }] });
    expect(getBlockReason(blocked, 'me', { 'slot-1': 'DECLINED' })).toBe('EXPIRED');
    expect(getBlockReason(slot(), 'me', { 'slot-1': 'CANCELLED' })).toBe('CANCELLED');
  });

  it('does not count a cancelled reservation as an active booking', () => {
    const mine = slot({ status: 'RESERVED', appointment: { id: 'a', customerId: 'me' } });
    expect(isActiveBookingFor(mine, 'me', {})).toBe(true);
    expect(isActiveBookingFor(mine, 'me', { 'slot-1': 'CANCELLED' })).toBe(false);
  });

  it('summarizes a day for the calendar', () => {
    expect(getDayAvailability(undefined, 'me', {})).toBe('none');
    expect(getDayAvailability([slot()], 'me', { 'slot-1': 'DECLINED' })).toBe('blocked');
    expect(getDayAvailability([slot({ status: 'RESERVED', appointment: { customerId: 'other' } })], 'me', {})).toBe('waitlist');
    expect(getDayAvailability([slot()], 'me', {})).toBe('available');
  });
});

describe('shared validation', () => {
  it.each([
    ['', 'Enter a password.'],
    ['short1', 'Use at least 8 characters, including one number.'],
    ['password', 'Use at least 8 characters, including one number.'],
    ['password1', null],
  ])('validates the password %j', (value, expected) => {
    expect(getPasswordError(value)).toBe(expected);
  });

  it('routes server messages only to fields on screen, in priority order', () => {
    expect(getServerErrorField('Slug name already taken', ['slug', 'name'])).toBe('slug');
    expect(getServerErrorField('Email already registered', ['email', 'password'])).toBe('email');
    expect(getServerErrorField('Email already registered', ['slug', 'name', 'owner'])).toBeNull();
  });
});

describe('access rules', () => {
  it('sends super admins to their console and everyone else to the demo', () => {
    expect(getHomePathForRole('SUPER_ADMIN')).toBe('/super-admin');
    expect(getHomePathForRole('CUSTOMER')).not.toBe('/super-admin');
  });

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', null])('rejects unsafe return path %j', (value) => {
    expect(getSafeReturnPath(value)).toBeNull();
  });
});

describe('formatting', () => {
  it('uses one time format across screens', () => {
    expect(formatTime('2026-11-13T10:00:00Z')).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
  });
});

describe('business time zone (America/Mexico_City, UTC-6)', () => {
  it.each([
    ['2026-11-13T23:30:00Z', '2026-11-13'],
    ['2026-11-14T05:30:00Z', '2026-11-13'],
    ['2026-12-01T05:30:00Z', '2026-11-30'],
    ['2027-01-01T03:00:00Z', '2026-12-31'],
    ['2028-03-01T05:00:00Z', '2028-02-29'],
  ])('groups %s under the business day %s, across month and year changes', (instant, day) => {
    expect(getDateKey(instant)).toBe(day);
  });

  it('formats the date and time in the business zone, not in UTC', () => {
    expect(formatLongDate('2026-12-01T05:30:00Z')).toBe('Monday, November 30');
    expect(formatTime('2026-12-01T05:30:00Z')).toBe('11:30 PM');
  });

  it('formats durations with Intl units', () => {
    expect(formatDuration('2026-11-13T10:00:00Z', '2026-11-13T10:30:00Z')).toBe('30 minutes');
    expect(formatDuration('2026-11-13T10:00:00Z', '2026-11-13T11:00:00Z')).toBe('1 hour');
    expect(formatDuration('2026-11-13T10:00:00Z', '2026-11-13T11:30:00Z')).toBe('1 hour 30 minutes');
  });
});

describe('started slots', () => {
  const now = Date.parse('2026-11-12T18:00:00Z');

  it('treats a slot as started from its exact start instant', () => {
    expect(hasStarted(slot({ startTime: '2026-11-12T18:00:00Z' }), now)).toBe(true);
    expect(hasStarted(slot({ startTime: '2026-11-12T18:00:01Z' }), now)).toBe(false);
  });

  it('keeps only the upcoming slots of today and later days', () => {
    const slots = [
      slot({ id: 'yesterday', startTime: '2026-11-11T18:00:00Z' }),
      slot({ id: 'earlier-today', startTime: '2026-11-12T16:00:00Z' }),
      slot({ id: 'later-today', startTime: '2026-11-12T20:00:00Z' }),
      slot({ id: 'next-month', startTime: '2026-12-01T15:00:00Z' }),
    ];
    expect(getUpcomingSlots(slots, now).map(item => item.id)).toEqual(['later-today', 'next-month']);
  });
});
