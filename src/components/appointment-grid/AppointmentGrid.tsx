'use client';

import { useState, useEffect } from 'react';
import { AppointmentSlot } from '@/types';
import { useUI } from '@/context/UIContext';
import { useLiveSlots } from '@/hooks/useLiveSlots';
import { readNow, useNow } from '@/hooks/useNow';
import { apiService } from '@/services/api';
import { ApiError, getErrorMessage } from '@/services/http-client';
import { hasSessionToken } from '@/services/session';
import { type CalendarDate } from '@internationalized/date';
import { I18nProvider } from 'react-aria-components';
import { APP_LOCALE } from '@/config/app';
import { Button, DatePicker, Divider, Icon, Skeleton, type DateAvailability, type DateValue } from '@/design-system';
import ConnectionNotice from '@/components/connection-notice';
import {
  formatDuration,
  formatLongDate,
  formatTime,
  formatTimeRange,
  getBusinessToday,
  getCalendarDate,
  getDateKey,
} from '@/domain/format';
import {
  getDayAvailability,
  getUpcomingSlots,
  hasStarted,
  isActiveBookingFor,
  isHoldFor,
  type LocalBlocks,
} from '@/domain/slots';
import styles from './AppointmentGrid.module.css';
import SlotCard from './slot-card';
import HoldOfferModal from './hold-offer-modal';

interface AppointmentGridProps {
  initialSlots: AppointmentSlot[];
  businessId: string;
  serverUserId: string;
  initialLoadComplete?: boolean;
}

export default function AppointmentGrid({ initialSlots, businessId, serverUserId, initialLoadComplete = false }: AppointmentGridProps) {
  const { success, error, info, warning, loading, confirm } = useUI();
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [activeHoldSlot, setActiveHoldSlot] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [rejectedSlotIds, setRejectedSlotIds] = useState<string[]>([]);
  const [localBlocks, setLocalBlocks] = useState<LocalBlocks>({});
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const initialBookedSlot = initialSlots.find((slot) => isActiveBookingFor(slot, serverUserId, localBlocks));

  const [myBookedSlotId, setMyBookedSlotId] = useState<string | null>(initialBookedSlot ? initialBookedSlot.id : null);
  const [myWaitlistSlotIds, setMyWaitlistSlotIds] = useState<string[]>([]);

  const { slots, setSlots, isOffline, isSyncing, reload, invalidate } = useLiveSlots({
    businessId,
    initialSlots,
    fetchOnMount: true,
    initialSyncing: !initialLoadComplete && initialSlots.length === 0,
    onSlots: (freshSlots) => {
      const freshMine = freshSlots.find((slot) => isActiveBookingFor(slot, serverUserId, localBlocks));
      setMyBookedSlotId(freshMine?.id ?? null);
      const myHold = freshSlots.find((slot) => isHoldFor(slot, serverUserId));
      if (!myHold) {
        setActiveHoldSlot(null);
      } else if (!activeHoldSlot && !rejectedSlotIds.includes(myHold.id)) {
        setActiveHoldSlot(myHold.id);
        setCountdown(30);
      }
    },
  });

  // Each day change fetches fresh availability; a newer pick cancels the previous request.
  const selectDate = (date: CalendarDate | null) => {
    setSelectedDate(date);
    void reload();
  };

  const now = useNow();
  const businessToday = getBusinessToday();
  const upcomingSlots = getUpcomingSlots(slots, now);
  // Partial typing and days that turned past at midnight stay in the field (flagged by minValue) but never filter.
  const activeDate = selectedDate && selectedDate.compare(businessToday) >= 0 ? selectedDate : null;

  const visibleSlots = activeDate
    ? upcomingSlots.filter((slot) => getDateKey(slot.startTime) === activeDate.toString())
    : upcomingSlots;
  const myBookedSlot = upcomingSlots.find((slot) => slot.id === myBookedSlotId);
  const groupedSlots = visibleSlots.reduce((acc, slot) => {
    const dateKey = getDateKey(slot.startTime);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();

  const slotsByDate = upcomingSlots.reduce((acc, slot) => {
    (acc[getDateKey(slot.startTime)] ??= []).push(slot);
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);

  const getDateAvailability = (date: DateValue): DateAvailability =>
    getDayAvailability(slotsByDate[date.toString()], serverUserId, localBlocks);
  useEffect(() => {
    if (!activeHoldSlot) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRejectedSlotIds((prevList) => [...prevList, activeHoldSlot]);
          setLocalBlocks((prevB) => ({ ...prevB, [activeHoldSlot]: 'DECLINED' }));
          setMyWaitlistSlotIds((prevW) => prevW.filter((id) => id !== activeHoldSlot));
          setActiveHoldSlot(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeHoldSlot]);

  const handleSlotAction = async (slot: AppointmentSlot) => {
    if (!hasSessionToken()) {
      info('Sign in to manage appointments.');
      window.location.assign('/login');
      return;
    }

    const isAvailable = slot.status === 'AVAILABLE';

    if (hasStarted(slot, readNow())) {
      warning('This time has already started. Choose a later slot.');
      return;
    }

    if (isAvailable && myBookedSlotId !== null) {
      warning('You can only have one active booking at a time.');
      return;
    }

    setLoadingSlotId(slot.id);
    const stopLoadingToast = loading(
      isAvailable ? 'Booking appointment...' : 'Joining the waitlist...',
    );

    try {
      if (isAvailable) {
        const bookingData = await apiService.bookAppointment(slot.id);
        invalidate();
        success('Appointment booked.');
        setMyBookedSlotId(slot.id);
        setSlots((prev) => 
          prev.map((s) => 
            s.id === slot.id 
              ? {
                ...s,
                status: 'RESERVED',
                appointment: {
                  id: bookingData.id || undefined,
                  customerId: bookingData.customerId || serverUserId,
                },
              }
              : s
          )
        );
      } else {
        await apiService.joinWaitlist(slot.id);
        invalidate();
        success('You joined the waitlist for this time.');
        setMyWaitlistSlotIds((prev) => [...prev, slot.id]);
      }
    } catch (err: unknown) {
      if (isAvailable && err instanceof ApiError && err.status === 409) {
        const availabilityRefreshed = await reload();
        warning(availabilityRefreshed
          ? 'Someone just booked this time. Availability has been updated; choose another slot.'
          : 'Someone just booked this time. Please try refreshing availability.');
        return;
      }

      const message = getErrorMessage(err, 'Unable to complete this action.');
      error(message);
    } finally {
      stopLoadingToast();
      setLoadingSlotId(null);
    }
  };
  const handleCancelAppointment = async (slot: AppointmentSlot) => {
    const appointmentId = slot.appointment?.id;

    if (!appointmentId) {
      error('No active appointment was found to cancel.');
      return;
    }

    const shouldCancel = await confirm({
      title: 'Cancel appointment',
      description: 'Are you sure you want to cancel your appointment? Your spot will be released.',
      confirmText: 'Yes, cancel',
      cancelText: 'Keep appointment',
      tone: 'danger',
    });

    if (!shouldCancel) {
      return;
    }

    setLoadingSlotId(slot.id);
    try {
      await apiService.cancelAppointment(appointmentId);
      invalidate();

      success('Your appointment was cancelled.');
      setMyBookedSlotId(null);
      setLocalBlocks((prev) => ({ ...prev, [slot.id]: 'CANCELLED' }));
      setSlots((prev) => 
        prev.map((s) => 
          s.id === slot.id 
            ? { ...s, appointment: null } 
            : s
        )
      );
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to cancel the appointment.');
      error(message);
    } finally {
      setLoadingSlotId(null);
    }
  };
  const handleLeaveWaitlist = async (slotId: string) => {
    const shouldLeave = await confirm({
      title: 'Leave waitlist',
      description: 'Do you want to leave the waitlist for this time? You will lose your place in line.',
      confirmText: 'Yes, leave',
      cancelText: 'Stay in line',
      tone: 'danger',
    });

    if (!shouldLeave) {
      return;
    }

    setLoadingSlotId(slotId);
    try {
      await apiService.leaveWaitlist(slotId);
      invalidate();

      success('You left the waitlist.');
      setMyWaitlistSlotIds((prev) => prev.filter((id) => id !== slotId));
      setLocalBlocks((prev) => ({ ...prev, [slotId]: 'DECLINED' }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to leave the waitlist.');
      error(message);
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleConfirmHold = async () => {
    const slotId = activeHoldSlot;
    if (!slotId) return;
    const stopLoadingToast = loading('Claiming appointment...');
    try {
      await apiService.confirmHold(slotId);
      invalidate();
      success('Appointment claimed.');
      setMyBookedSlotId(slotId);
      setMyWaitlistSlotIds((prev) => prev.filter((id) => id !== slotId));
      setActiveHoldSlot(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to claim this appointment.');
      error(message);
      setActiveHoldSlot(null);
    } finally {
      stopLoadingToast();
    }
  };
  const handleDeclineHold = async () => {
    const slotId = activeHoldSlot;
    if (!slotId) return;
    setRejectedSlotIds((prev) => [...prev, slotId]);
    setLocalBlocks((prev) => ({ ...prev, [slotId]: 'DECLINED' }));
    setMyWaitlistSlotIds((prev) => prev.filter((id) => id !== slotId));
    setActiveHoldSlot(null);

    try {
      await apiService.declineHold(slotId);
      invalidate();
    } catch (err: unknown) {
      error(getErrorMessage(err, 'Unable to decline this appointment.'));
    }
  };

  return (
    <section className={styles.agenda} aria-label="Available appointments" data-offline={isOffline || undefined}>
      <div className={styles.toolbarRow}>
        <div className={styles.toolbar}>
          <I18nProvider locale={APP_LOCALE}>
            <DatePicker
              value={selectedDate}
              onChange={selectDate}
              minValue={businessToday}
              getDateAvailability={getDateAvailability}
              errorMessage="Choose a date that has appointments."
            />
          </I18nProvider>
        </div>
        {myBookedSlot && (
          <section className={styles.bookingSummary} role="status" aria-labelledby="booking-summary-title">
            <div className={styles.summaryHeading}>
              <Icon name="checkCircle" className={styles.summaryIcon} />
              <div>
                <h2 id="booking-summary-title" className={styles.summaryTitle}>Booking confirmed</h2>
                <p className={styles.summaryMessage}>Your time is reserved.</p>
              </div>
            </div>
            <dl className={styles.summaryDetails}>
              <div className={styles.summaryField}>
                <dt>Date</dt>
                <dd>{formatLongDate(myBookedSlot.startTime)}</dd>
              </div>
              <div className={styles.summaryField}>
                <dt>Time</dt>
                <dd>{formatTimeRange(myBookedSlot.startTime, myBookedSlot.endTime)}</dd>
              </div>
              <div className={styles.summaryField}>
                <dt>Staff ID</dt>
                <dd className={styles.summaryStaffId} title={myBookedSlot.staffId}>{myBookedSlot.staffId}</dd>
              </div>
              <div className={styles.summaryField}>
                <dt>Duration</dt>
                <dd>{formatDuration(myBookedSlot.startTime, myBookedSlot.endTime)}</dd>
              </div>
            </dl>
            <Button
              variant="outlined"
              size="small"
              className={styles.summaryAction}
              onPress={() => selectDate(getCalendarDate(myBookedSlot.startTime))}
            >
              View appointment
            </Button>
          </section>
        )}
      </div>
      <Divider />
      <ConnectionNotice isOffline={isOffline} onRetry={reload} />
      {isSyncing && slots.length === 0 ? (
        <div className={styles.loadingState} role="status" aria-label="Loading appointment slots" aria-busy="true">
          <div className={styles.loadingDateGroup} aria-hidden="true">
            <Skeleton variant="text" width="calc(var(--size-64) * 2)" height="var(--line-height-32)" />
            <ul className={styles.loadingSlots}>
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index}>
                  <Skeleton
                    className={styles.loadingCard}
                    variant="rectangular"
                    height="calc(var(--size-64) * 2 + var(--size-32))"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : visibleSlots.length === 0 ? (
        <div role="status" className={styles.empty}>
          {activeDate ? 'No appointments available for this date.' : 'No appointments available right now.'}
        </div>
      ) : null}
      <div className={styles.dates}>
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className={styles.dateGroup}>
            <h2 className={styles.dateTitle}>
              {formatLongDate(groupedSlots[dateKey][0].startTime)}
            </h2>
            <ul className={styles.slots} aria-label={formatLongDate(groupedSlots[dateKey][0].startTime)}>
              {groupedSlots[dateKey].map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  serverUserId={serverUserId}
                  myBookedSlotId={myBookedSlotId}
                  myWaitlistSlotIds={myWaitlistSlotIds}
                  localBlocks={localBlocks}
                  loadingSlotId={loadingSlotId}
                  formatTime={formatTime}
                  onSlotAction={handleSlotAction}
                  onCancelAppointment={handleCancelAppointment}
                  onLeaveWaitlist={handleLeaveWaitlist}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {activeHoldSlot && (
        <HoldOfferModal
          countdown={countdown}
          onDecline={handleDeclineHold}
          onConfirm={handleConfirmHold}
        />
      )}
    </section>
  );
}
