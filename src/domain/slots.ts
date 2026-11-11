import type { AppointmentSlot, BlockReason, SlotStatus } from '@/types';

export type LocalBlocks = Readonly<Record<string, 'CANCELLED' | 'DECLINED'>>;
export type DayAvailability = 'none' | 'blocked' | 'available' | 'waitlist';
export type SlotTone = 'success' | 'warning' | 'error';

export const SLOT_STATUS_TONE: Readonly<Record<SlotStatus, SlotTone>> = {
  AVAILABLE: 'success',
  HOLD: 'warning',
  RESERVED: 'error',
};

export const ADMIN_SLOT_STATUS_LABEL: Readonly<Record<SlotStatus, string>> = {
  AVAILABLE: 'Active',
  HOLD: 'Hold',
  RESERVED: 'Reserved',
};

export const CUSTOMER_SLOT_STATUS_LABEL: Readonly<Record<SlotStatus, string>> = {
  AVAILABLE: 'Available',
  HOLD: 'On hold',
  RESERVED: 'Busy',
};

/** Server blocks win over optimistic local ones. */
export function getBlockReason(slot: AppointmentSlot, userId: string, localBlocks: LocalBlocks): BlockReason | undefined {
  return slot.slotBlocks?.find(block => block.customerId === userId)?.reason ?? localBlocks[slot.id];
}

export const isBlockedFor = (slot: AppointmentSlot, userId: string, localBlocks: LocalBlocks) =>
  getBlockReason(slot, userId, localBlocks) !== undefined;

export const isReservedBy = (slot: AppointmentSlot, userId: string) =>
  slot.status === 'RESERVED' && slot.appointment?.customerId === userId;

export const isActiveBookingFor = (slot: AppointmentSlot, userId: string, localBlocks: LocalBlocks) =>
  isReservedBy(slot, userId) && !isBlockedFor(slot, userId, localBlocks);

export const isHoldFor = (slot: AppointmentSlot, userId: string) =>
  slot.status === 'HOLD' && slot.appointment?.customerId === userId;

export const isOnWaitlist = (slot: AppointmentSlot, userId: string) =>
  !!slot.waitlistEntries?.some(entry => entry.customerId === userId);

/** A slot that already started can no longer be booked, joined or claimed. */
export const hasStarted = (slot: AppointmentSlot, now: number) => Date.parse(slot.startTime) <= now;

export const getUpcomingSlots = (slots: readonly AppointmentSlot[], now: number) =>
  slots.filter(slot => !hasStarted(slot, now));

export function getDayAvailability(daySlots: readonly AppointmentSlot[] | undefined, userId: string, localBlocks: LocalBlocks): DayAvailability {
  if (!daySlots?.length) return 'none';
  const open = daySlots.filter(slot => !isBlockedFor(slot, userId, localBlocks));
  if (!open.length) return 'blocked';
  return open.some(slot => slot.status === 'AVAILABLE' || isActiveBookingFor(slot, userId, localBlocks))
    ? 'available'
    : 'waitlist';
}
