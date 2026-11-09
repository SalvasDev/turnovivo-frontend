
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
