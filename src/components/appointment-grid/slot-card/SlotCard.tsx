import type { FC } from 'react';
import type { AppointmentSlot } from '@/types';
import { Card, type BadgeProps, type BaseButtonProps } from '@/design-system';
import styles from './SlotCard.module.css';

interface SlotCardProps {
  slot: AppointmentSlot;
  serverUserId: string;
  myBookedSlotId: string | null;
  myWaitlistSlotIds: string[];
  localBlocks: Record<string, 'CANCELLED' | 'DECLINED'>;
  loadingSlotId: string | null;
  formatTime: (isoString: string) => string;
  onSlotAction: (slot: AppointmentSlot) => void;
  onCancelAppointment: (slot: AppointmentSlot) => void;
  onLeaveWaitlist: (slotId: string) => void;
}

const SlotCard: FC<SlotCardProps> = ({
  slot,
  serverUserId,
  myBookedSlotId,
  myWaitlistSlotIds,
  localBlocks,
  loadingSlotId,
  formatTime,
  onSlotAction,
  onCancelAppointment,
  onLeaveWaitlist,
}) => {
  const serverBlock = slot.slotBlocks?.find((b) => b.customerId === serverUserId);
  const blockReason: string | undefined = serverBlock?.reason || localBlocks[slot.id];
  const isBlocked = !!blockReason;
  const isCancelled = blockReason === 'CANCELLED';

  const isMine =
    !isBlocked &&
    ((slot.status === 'RESERVED' && slot.appointment?.customerId === serverUserId) ||
      myBookedSlotId === slot.id);

  const isHoldForMe =
    !isBlocked && slot.status === 'HOLD' && slot.appointment?.customerId === serverUserId;

  const amIWaiting =
    !isBlocked &&
    !isMine &&
    !isHoldForMe &&
    (slot.waitlistEntries?.some((w) => w.customerId === serverUserId) ||
      myWaitlistSlotIds.includes(slot.id));

  const isAvailable = slot.status === 'AVAILABLE' && !isMine && !isBlocked;
  const isPending = loadingSlotId === slot.id;
  const statusLabel = isBlocked
    ? (isCancelled ? 'Cancelled' : 'Declined')
    : isMine ? 'Your turn' : isAvailable ? 'Available' : slot.status === 'HOLD' ? 'On hold' : 'Busy';
  const badges: BadgeProps[] = [{
    children: statusLabel,
    color: isBlocked ? 'error' : isMine || isAvailable ? 'success' : slot.status === 'HOLD' ? 'warning' : 'error',
    appearance: isMine ? 'solid' : 'light',
  }];

  if (amIWaiting) {
    badges.push({ children: 'Waiting', color: 'warning', appearance: 'solid' });
  }

  let action: BaseButtonProps;
  if (isBlocked) {
    action = { children: isCancelled ? 'Cancelled' : 'Declined', isDisabled: true };
  } else if (isMine) {
    action = {
      children: isPending ? 'Cancelling...' : 'Cancel appointment',
      isDisabled: loadingSlotId !== null,
      onPress: () => onCancelAppointment(slot),
    };
  } else if (isHoldForMe) {
    action = { children: 'On hold for you', isDisabled: true };
  } else if (amIWaiting) {
    action = {
      children: isPending ? 'Leaving...' : 'Leave waitlist',
      isDisabled: loadingSlotId !== null,
      onPress: () => onLeaveWaitlist(slot.id),
    };
  } else {
    action = {
      children: isPending ? (isAvailable ? 'Booking...' : 'Joining...')
        : isAvailable ? 'Reserve' : myBookedSlotId !== null ? 'Blocked' : 'Join waitlist',
      variant: isAvailable ? 'filled' : 'outlined',
      isDisabled: loadingSlotId !== null || slot.status === 'HOLD' || (!isAvailable && myBookedSlotId !== null),
      onPress: () => onSlotAction(slot),
    };
  }

  return (
    <Card
      role="listitem"
      lang="en"
      aria-label={`Appointment ${formatTime(slot.startTime)}: ${statusLabel.toLowerCase()}`}
      data-slot-status={isBlocked ? 'blocked' : isMine ? 'mine' : slot.status.toLowerCase()}
      className={styles.slotCard}
      title={formatTime(slot.startTime)}
      badges={badges}
      action={{ ...action, isPending }}
    />
  );
};

export default SlotCard;
