'use client';

import { useState, useEffect, useRef } from 'react';
import { AppointmentSlot } from '@/types';
import Cookies from 'js-cookie';
import { useUI } from '@/context/UIContext';
import { ApiError, apiService } from '@/services/api';
import { getLocalTimeZone, parseDate, today, type CalendarDate } from '@internationalized/date';
import { I18nProvider } from 'react-aria-components';
import { Button, DatePicker, Divider, Icon, Skeleton, type DateAvailability, type DateValue } from '@/design-system';
import ConnectionNotice from '@/components/connection-notice';
import styles from './AppointmentGrid.module.css';
import SlotCard from './slot-card';
import HoldOfferModal from './hold-offer-modal';

interface AppointmentGridProps {
  initialSlots: AppointmentSlot[];
  businessId: string;
  serverUserId: string;
  initialLoadComplete?: boolean;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

function isActiveBooking(slot: AppointmentSlot, userId: string, localBlocks: Record<string, string>) {
  return slot.status === 'RESERVED'
    && slot.appointment?.customerId === userId
    && !localBlocks[slot.id]
    && !slot.slotBlocks?.some((block) => block.customerId === userId);
}

function formatDuration(startTime: string, endTime: string) {
  const totalMinutes = Math.max(0, Math.round((Date.parse(endTime) - Date.parse(startTime)) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} minutes`;
  return minutes === 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : `${hours} hr ${minutes} min`;
}

export default function AppointmentGrid({ initialSlots, businessId, serverUserId, initialLoadComplete = false }: AppointmentGridProps) {
  const { success, error, info, warning, loading, confirm } = useUI();
  const [slots, setSlots] = useState<AppointmentSlot[]>(initialSlots);
  const [isSyncing, setIsSyncing] = useState(!initialLoadComplete && initialSlots.length === 0);
  const [isOffline, setIsOffline] = useState(false);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [activeHoldSlot, setActiveHoldSlot] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [rejectedSlotIds, setRejectedSlotIds] = useState<string[]>([]);
  const [localBlocks, setLocalBlocks] = useState<Record<string, 'CANCELLED' | 'DECLINED'>>({});
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const slotsRefreshRef = useRef<() => Promise<void>>(async () => undefined);
  const initialBookedSlot = initialSlots.find((slot) => isActiveBooking(slot, serverUserId, localBlocks));

  const [myBookedSlotId, setMyBookedSlotId] = useState<string | null>(initialBookedSlot ? initialBookedSlot.id : null);
  const [myWaitlistSlotIds, setMyWaitlistSlotIds] = useState<string[]>([]);

  const formatTime = (isoString: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(new Date(isoString));
    return parts.map((part) => part.type === 'dayPeriod'
      ? (part.value === 'AM' ? 'A.M.' : 'P.M.')
      : part.value.replace(/\s+/g, ' ')).join('');
  };

  const formatDateHeader = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTimeRange = (slot: AppointmentSlot) => `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;

  const getDateKey = (isoString: string) => {
    return new Date(isoString).toISOString().split('T')[0];
  };

  const visibleSlots = selectedDate
    ? slots.filter((slot) => getDateKey(slot.startTime) === selectedDate.toString())
    : slots;
  const myBookedSlot = slots.find((slot) => slot.id === myBookedSlotId);
  const groupedSlots = visibleSlots.reduce((acc, slot) => {
    const dateKey = getDateKey(slot.startTime);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();

  const slotsByDate = slots.reduce((acc, slot) => {
    (acc[getDateKey(slot.startTime)] ??= []).push(slot);
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);

  const isBlockedForMe = (slot: AppointmentSlot) =>
    !!localBlocks[slot.id] || !!slot.slotBlocks?.some((block) => block.customerId === serverUserId);

  const getDateAvailability = (date: DateValue): DateAvailability => {
    const daySlots = slotsByDate[date.toString()];
    if (!daySlots?.length) return 'none';
    const open = daySlots.filter((slot) => !isBlockedForMe(slot));
    if (!open.length) return 'blocked';
    const hasOpenOrMine = open.some((slot) => slot.status === 'AVAILABLE' || isActiveBooking(slot, serverUserId, localBlocks));
    return hasOpenOrMine ? 'available' : 'waitlist';
  };
  useEffect(() => {
    let cancelled = false;
    let request: Promise<void> | null = null;
    const fetchFreshData = (): Promise<void> => {
      if (request) return request;
      request = (async () => {
        try {
          const freshSlots = await apiService.getAvailableSlots(businessId);
          if (cancelled) return;
          setIsOffline(false);
          setSlots(freshSlots);
          const freshMine = freshSlots.find((slot) => isActiveBooking(slot, serverUserId, localBlocks));
          setMyBookedSlotId(freshMine?.id ?? null);
          const myHold = freshSlots.find(
            (s) => s.status === 'HOLD' && s.appointment?.customerId === serverUserId,
          );
          if (myHold) {
            if (!activeHoldSlot && !rejectedSlotIds.includes(myHold.id)) {
              setActiveHoldSlot(myHold.id);
              setCountdown(30);
            }
          } else {
            setActiveHoldSlot(null);
          }
        } catch {
          if (!cancelled) setIsOffline(true);
        } finally {
          if (!cancelled) setIsSyncing(false);
          request = null;
        }
      })();
      return request;
    };

    slotsRefreshRef.current = fetchFreshData;
    void fetchFreshData();
    const interval = setInterval(() => { void fetchFreshData(); }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (slotsRefreshRef.current === fetchFreshData) {
        slotsRefreshRef.current = async () => undefined;
      }
    };
  }, [businessId, activeHoldSlot, serverUserId, myBookedSlotId, rejectedSlotIds, localBlocks]);
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
    const token = Cookies.get('turnovivo_token');
    if (!token) {
      info('Sign in to manage appointments.');
      window.location.assign('/login');
      return;
    }

    const isAvailable = slot.status === 'AVAILABLE';

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
        const bookingData = await apiService.bookAppointment(slot.id, token);
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
        await apiService.joinWaitlist(slot.id, token);
        success('You joined the waitlist for this time.');
        setMyWaitlistSlotIds((prev) => [...prev, slot.id]);
      }
    } catch (err: unknown) {
      if (isAvailable && err instanceof ApiError && err.status === 409) {
        let availabilityRefreshed = false;
        try {
          const freshSlots = await apiService.getAvailableSlots(businessId);
          setSlots(freshSlots);
          const freshMine = freshSlots.find((freshSlot) => isActiveBooking(freshSlot, serverUserId, localBlocks));
          setMyBookedSlotId(freshMine?.id ?? null);
          availabilityRefreshed = true;
        } catch {
          availabilityRefreshed = false;
        }

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
    const token = Cookies.get('turnovivo_token');
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
      await apiService.cancelAppointment(appointmentId, token || '');

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
    const token = Cookies.get('turnovivo_token');

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
      await apiService.leaveWaitlist(slotId, token || '');

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
    const token = Cookies.get('turnovivo_token');
    const slotId = activeHoldSlot;
    if (!slotId) return;
    const stopLoadingToast = loading('Claiming appointment...');
    try {
      await apiService.confirmHold(slotId, token || '');
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

    const token = Cookies.get('turnovivo_token');
    try {
      await apiService.declineHold(slotId, token || '');
    } catch (err: unknown) {
      error(getErrorMessage(err, 'Unable to decline this appointment.'));
    }
  };

  return (
    <section className={styles.agenda} aria-label="Available appointments">
      <div className={styles.toolbarRow}>
        <div className={styles.toolbar}>
          <I18nProvider locale="en-GB">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              minValue={today(getLocalTimeZone())}
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
                <dd>{formatDateHeader(myBookedSlot.startTime)}</dd>
              </div>
              <div className={styles.summaryField}>
                <dt>Time</dt>
                <dd>{formatTimeRange(myBookedSlot)}</dd>
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
              onPress={() => setSelectedDate(parseDate(getDateKey(myBookedSlot.startTime)))}
            >
              View appointment
            </Button>
          </section>
        )}
      </div>
      <Divider />
      <ConnectionNotice isOffline={isOffline} onRetry={() => slotsRefreshRef.current()} />
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
          {selectedDate ? 'No appointments available for this date.' : 'No appointments available right now.'}
        </div>
      ) : null}
      <div className={styles.dates}>
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className={styles.dateGroup}>
            <h2 className={styles.dateTitle}>
              {formatDateHeader(groupedSlots[dateKey][0].startTime)}
            </h2>
            <ul className={styles.slots} aria-label={formatDateHeader(groupedSlots[dateKey][0].startTime)}>
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
