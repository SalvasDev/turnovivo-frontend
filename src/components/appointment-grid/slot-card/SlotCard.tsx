import type { FC } from 'react';
import type { AppointmentSlot } from '@/types';
import { Card, type BadgeProps, type BaseButtonProps } from '@/design-system';
import {
  CUSTOMER_SLOT_STATUS_LABEL,
  getBlockReason,
  isHoldFor,
  isOnWaitlist,
  isReservedBy,
  SLOT_STATUS_TONE,
  type LocalBlocks,
} from '@/domain/slots';
import styles from './SlotCard.module.css';

interface SlotCardProps {
  slot: AppointmentSlot;
  serverUserId: string;
  myBookedSlotId: string | null;
  myWaitlistSlotIds: string[];
  localBlocks: LocalBlocks;
  loadingSlotId: string | null;
  formatTime: (isoString: string) => string;
  onSlotAction: (slot: AppointmentSlot) => Promise<void>;
  onCancelAppointment: (slot: AppointmentSlot) => Promise<void>;
  onLeaveWaitlist: (slotId: string) => Promise<void>;
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
  const blockReason = getBlockReason(slot, serverUserId, localBlocks);
  const isBlocked = !!blockReason;
  const isCancelled = blockReason === 'CANCELLED';

  const isMine = !isBlocked && (isReservedBy(slot, serverUserId) || myBookedSlotId === slot.id);

  const isHoldForMe = !isBlocked && isHoldFor(slot, serverUserId);

  const amIWaiting =
    !isBlocked &&
    !isMine &&
    !isHoldForMe &&
    (isOnWaitlist(slot, serverUserId) || myWaitlistSlotIds.includes(slot.id));

  const isAvailable = slot.status === 'AVAILABLE' && !isMine && !isBlocked;
  const isPending = loadingSlotId === slot.id;
  const statusLabel = isBlocked
    ? (isCancelled ? 'Cancelled' : 'Declined')
    : isMine ? 'Your turn' : CUSTOMER_SLOT_STATUS_LABEL[slot.status];
  const badges: BadgeProps[] = [{
    children: statusLabel,
    color: isBlocked ? 'error' : isMine ? 'success' : SLOT_STATUS_TONE[slot.status],
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
    <li className={styles.item}>
      <Card
        aria-label={`Appointment ${formatTime(slot.startTime)}: ${statusLabel.toLowerCase()}`}
        data-slot-status={isBlocked ? 'blocked' : isMine ? 'mine' : slot.status.toLowerCase()}
        className={styles.slotCard}
        title={formatTime(slot.startTime)}
        badges={badges}
        action={{ ...action, isPending }}
      />
    </li>
  );
};

export default SlotCard;
