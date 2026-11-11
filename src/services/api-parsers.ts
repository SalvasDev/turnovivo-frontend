import type { AppointmentSlot, BlockReason, Business, SlotBlock, SlotStatus } from '@/types';
import type { AdminUser, BusinessAdmin } from '@/components/super-admin/super-admin-business-client';

type JsonRecord = Record<string, unknown>;

const SLOT_STATUSES: readonly SlotStatus[] = ['AVAILABLE', 'RESERVED', 'HOLD'];
const BLOCK_REASONS: readonly BlockReason[] = ['CANCELLED', 'DECLINED', 'EXPIRED'];

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isDateText = (value: unknown): value is string => isText(value) && !Number.isNaN(Date.parse(value));
const textOrEmpty = (value: unknown) => (typeof value === 'string' ? value : '');
const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  options.includes(value as T);

/** Reads a JSON body without throwing on empty, non-JSON or malformed responses. */
export async function readJsonBody(response: Response): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes('json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function parseMessage(payload: unknown): { message?: string } {
  if (!isRecord(payload)) return {};
  const { message } = payload;
  if (isText(message)) return { message };
  if (Array.isArray(message)) {
    const parts = message.filter(isText);
    if (parts.length) return { message: parts.join(', ') };
  }
  return {};
}

export function parseAccessToken(payload: unknown): { accessToken: string } | null {
  return isRecord(payload) && isText(payload.accessToken) ? { accessToken: payload.accessToken } : null;
}

export function parseBookResponse(payload: unknown) {
  const record = isRecord(payload) ? payload : {};
  return { ...parseMessage(payload), id: textOrEmpty(record.id), customerId: textOrEmpty(record.customerId) };
}

export function parseUser(payload: unknown) {
  const record = isRecord(payload) ? payload : {};
  return { id: textOrEmpty(record.id), email: textOrEmpty(record.email), role: textOrEmpty(record.role) };
}

export function parseBusiness(payload: unknown): Business | null {
  if (!isRecord(payload) || !isText(payload.id) || !isText(payload.name)) return null;
  return {
    id: payload.id,
    name: payload.name,
    slug: textOrEmpty(payload.slug),
    createdAt: textOrEmpty(payload.createdAt),
  };
}

function parseSlot(value: unknown): AppointmentSlot | null {
  if (!isRecord(value)) return null;
  const { id, startTime, endTime, status, appointment } = value;
  if (!isText(id) || !isDateText(startTime) || !isDateText(endTime) || !isOneOf(SLOT_STATUSES, status)) {
    return null;
  }

  const waitlistEntries = (Array.isArray(value.waitlistEntries) ? value.waitlistEntries : [])
    .filter((entry): entry is JsonRecord => isRecord(entry) && isText(entry.customerId))
    .map(entry => ({ customerId: entry.customerId as string }));
  const slotBlocks: SlotBlock[] = (Array.isArray(value.slotBlocks) ? value.slotBlocks : [])
    .filter((block): block is JsonRecord =>
      isRecord(block) && isText(block.customerId) && isOneOf(BLOCK_REASONS, block.reason))
    .map(block => ({ customerId: block.customerId as string, reason: block.reason as BlockReason }));

  return {
    ...value,
    id,
    businessId: textOrEmpty(value.businessId),
    staffId: textOrEmpty(value.staffId),
    startTime,
    endTime,
    status,
    appointment: isRecord(appointment) && (isText(appointment.id) || isText(appointment.customerId))
      ? {
        ...appointment,
        id: isText(appointment.id) ? appointment.id : undefined,
        customerId: textOrEmpty(appointment.customerId),
      }
      : null,
    waitlistEntries,
    slotBlocks,
  };
}

/** Drops malformed slots so one bad record can't take the whole agenda down. */
export function parseSlots(payload: unknown): AppointmentSlot[] | null {
  if (!Array.isArray(payload)) return null;
  return payload.flatMap(item => parseSlot(item) ?? []);
}

export function parseBusinessAdmins(payload: unknown): BusinessAdmin[] | null {
  if (!Array.isArray(payload)) return null;
  return payload
    .filter((item): item is JsonRecord => isRecord(item) && isText(item.id) && isText(item.name))
    .map(item => ({
      id: item.id as string,
      name: item.name as string,
      slug: textOrEmpty(item.slug),
      ownerId: textOrEmpty(item.ownerId),
      ownerEmail: textOrEmpty(item.ownerEmail),
      active: item.active === true,
      createdAt: textOrEmpty(item.createdAt),
    }));
}

export function parseAdminUser(payload: unknown): AdminUser | null {
  if (!isRecord(payload) || !isText(payload.id)) return null;
  return { id: payload.id, email: textOrEmpty(payload.email), role: textOrEmpty(payload.role) };
}

export function parseAdminUsers(payload: unknown): AdminUser[] | null {
  if (!Array.isArray(payload)) return null;
  return payload.flatMap(item => parseAdminUser(item) ?? []);
}
