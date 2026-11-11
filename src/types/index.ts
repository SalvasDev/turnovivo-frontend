
export type SlotStatus = 'AVAILABLE' | 'RESERVED' | 'HOLD';
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type BlockReason = 'CANCELLED' | 'DECLINED' | 'EXPIRED';

export interface Business {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface SlotBlock {
  customerId: string;
  reason: BlockReason;
}

export interface AppointmentSlot {
  id: string;
  businessId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointment?: { id?: string; customerId: string } | null;
  waitlistEntries?: { customerId: string }[];
  slotBlocks?: SlotBlock[];
}

export interface Appointment {
  id: string;
  slotId: string;
  customerId: string;
  status: AppointmentStatus;
  createdAt: string;
}

// API response contracts, produced only by the parsers in services/api-parsers.

export interface ApiMessage {
  message?: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface BookResponse extends ApiMessage {
  id: string;
  customerId: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface BusinessAdmin {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string;
  active: boolean;
  createdAt: string;
}

export interface TokenClaims {
  sub: string;
  email: string;
  role: string;
}
