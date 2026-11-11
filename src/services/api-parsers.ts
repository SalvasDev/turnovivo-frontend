import type {
  AdminUser,
  ApiMessage,
  AppointmentSlot,
  BlockReason,
  BookResponse,
  Business,
  BusinessAdmin,
  LoginResponse,
  RegisteredUser,
  SlotBlock,
  SlotStatus,
  TokenClaims,
} from '@/types';

type JsonRecord = Record<string, unknown>;

const SLOT_STATUSES: readonly SlotStatus[] = ['AVAILABLE', 'RESERVED', 'HOLD'];
const BLOCK_REASONS: readonly BlockReason[] = ['CANCELLED', 'DECLINED', 'EXPIRED'];

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isDateText = (value: unknown): value is string => isText(value) && !Number.isNaN(Date.parse(value));
const textOrEmpty = (value: unknown) => (typeof value === 'string' ? value : '');
const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  options.some(option => option === value);
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Reads a JSON body without throwing on empty, non-JSON or malformed responses. */
export async function readJsonBody(response: Response): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes('json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function parseMessage(payload: unknown): ApiMessage {
  if (!isRecord(payload)) return {};
  const { message } = payload;
  if (isText(message)) return { message };
  if (Array.isArray(message)) {
    const parts = message.filter(isText);
    if (parts.length) return { message: parts.join(', ') };
  }
  return {};
}

export function parseAccessToken(payload: unknown): LoginResponse | null {
  return isRecord(payload) && isText(payload.accessToken) ? { accessToken: payload.accessToken } : null;
}

/** Decodes the JWT payload without verifying it; the backend remains the authority. */
export function parseTokenClaims(token: string): TokenClaims | null {
  const segment = token.split('.')[1];
  if (!segment) return null;
  try {
    const binary = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
    const claims: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
    if (!isRecord(claims) || !isText(claims.sub)) return null;
    return { sub: claims.sub, email: textOrEmpty(claims.email), role: textOrEmpty(claims.role) };
  } catch {
    return null;
  }
}

export function parseBookResponse(payload: unknown): BookResponse {
  const record = isRecord(payload) ? payload : {};
  return { ...parseMessage(payload), id: textOrEmpty(record.id), customerId: textOrEmpty(record.customerId) };
}

export function parseUser(payload: unknown): RegisteredUser {
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

  const waitlistEntries = listOf(value.waitlistEntries).flatMap(entry =>
    isRecord(entry) && isText(entry.customerId) ? [{ customerId: entry.customerId }] : []);
  const slotBlocks = listOf(value.slotBlocks).flatMap((block): SlotBlock[] =>
    isRecord(block) && isText(block.customerId) && isOneOf(BLOCK_REASONS, block.reason)
      ? [{ customerId: block.customerId, reason: block.reason }]
      : []);

  return {
    id,
    businessId: textOrEmpty(value.businessId),
    staffId: textOrEmpty(value.staffId),
    startTime,
    endTime,
    status,
    appointment: isRecord(appointment) && (isText(appointment.id) || isText(appointment.customerId))
      ? {
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
  return payload.flatMap((item): BusinessAdmin[] =>
    isRecord(item) && isText(item.id) && isText(item.name)
      ? [{
        id: item.id,
        name: item.name,
        slug: textOrEmpty(item.slug),
        ownerId: textOrEmpty(item.ownerId),
        ownerEmail: textOrEmpty(item.ownerEmail),
        active: item.active === true,
        createdAt: textOrEmpty(item.createdAt),
      }]
      : []);
}

export function parseAdminUser(payload: unknown): AdminUser | null {
  if (!isRecord(payload) || !isText(payload.id)) return null;
  return { id: payload.id, email: textOrEmpty(payload.email), role: textOrEmpty(payload.role) };
}

export function parseAdminUsers(payload: unknown): AdminUser[] | null {
  if (!Array.isArray(payload)) return null;
  return payload.flatMap(item => parseAdminUser(item) ?? []);
}
