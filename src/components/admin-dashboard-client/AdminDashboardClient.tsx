'use client';

import { useState } from 'react';
import type { AppointmentSlot } from '@/types';
import { useUI } from '@/context/UIContext';
import { useLiveSlots } from '@/hooks/useLiveSlots';
import { useNow } from '@/hooks/useNow';
import { apiService } from '@/services/api';
import { getErrorMessage } from '@/services/http-client';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { Badge, Button, Icon, Table, type TableColumn } from '@/design-system';
import ConnectionNotice from '@/components/connection-notice';
import { formatShortDate as formatDate, formatTime, formatTimeRange } from '@/domain/format';
import { ADMIN_SLOT_STATUS_LABEL, getUpcomingSlots, SLOT_STATUS_TONE } from '@/domain/slots';
import styles from './AdminDashboardClient.module.css';

interface AdminDashboardClientProps {
  initialSlots: AppointmentSlot[];
  businessId: string;
}

export default function AdminDashboardClient({ initialSlots, businessId }: AdminDashboardClientProps) {
  const { success, error, loading, confirm } = useUI();
  const { slots, isOffline, reload, invalidate } = useLiveSlots({ businessId, initialSlots, authenticated: true });
  const upcomingSlots = getUpcomingSlots(slots, useNow());
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);

  const handleForceCancel = async (slot: AppointmentSlot) => {
    if (loadingSlotId !== null) return;
    const appointmentId = slot.appointment?.id;

    if (!appointmentId) {
      error('This time slot has no active appointment.');
      return;
    }

    const shouldForceCancel = await confirm({
      title: 'Force cancellation',
      description: `Force the cancellation of the ${formatTime(slot.startTime)} appointment? This frees the slot or triggers the Redis waitlist cascade.`,
      confirmText: 'Yes, cancel',
      cancelText: 'Go back',
      tone: 'danger',
    });

    if (!shouldForceCancel) {
      return;
    }

    setLoadingSlotId(slot.id);
    const stopLoadingToast = loading('Cancelling appointment...');
    try {
      const data = await apiService.cancelAppointment(appointmentId);
      invalidate();

      success(`Appointment cancelled by admin. ${data.message ?? ''}`.trim());
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Unable to cancel the appointment.');
      error(message);
    } finally {
      stopLoadingToast();
      setLoadingSlotId(null);
    }
  };

  const columns: TableColumn<AppointmentSlot>[] = [
    {
      id: 'date', header: 'Date', isRowHeader: true, width: '15%',
      renderCell: slot => <span className={styles.time}>{formatDate(slot.startTime)}</span>,
    },
    {
      id: 'slot', header: 'Slot', width: '25%',
      renderCell: slot => <span className={styles.time}>{formatTimeRange(slot.startTime, slot.endTime)}</span>,
    },
    {
      id: 'status', header: 'Status', width: '15%',
      renderCell: slot => (
        <Badge className={styles.status} color={SLOT_STATUS_TONE[slot.status]}>
          {ADMIN_SLOT_STATUS_LABEL[slot.status]}
        </Badge>
      ),
    },
    {
      id: 'client', header: 'Client ID', width: '36%',
      renderCell: slot => {
        const customerId = slot.appointment?.customerId;
        if (customerId) return <span className={styles.client} title={customerId}>{customerId}</span>;
        return slot.status === 'HOLD' ? 'Assigning...' : '-';
      },
    },
    {
      id: 'actions', header: <span className={styles.srOnly}>Actions</span>, width: '9%',
      renderCell: slot => (
        <MenuTrigger>
          <Button
            iconOnly
            variant="text"
            color="neutral"
            size="small"
            aria-label={`Actions for ${formatDate(slot.startTime)} ${formatTimeRange(slot.startTime, slot.endTime)}`}
            isDisabled={loadingSlotId !== null}
            isPending={loadingSlotId === slot.id}
            pendingLabel="Cancelling appointment"
          >
            <span title="Appointment actions"><Icon name="moreVertical" /></span>
          </Button>
          <Popover placement="bottom end" offset={8} className={styles.popover}>
            <Menu aria-label="Appointment actions" className={styles.menu}>
              <MenuItem
                className={styles.menuItem}
                isDisabled={loadingSlotId !== null || slot.status !== 'RESERVED' || !slot.appointment?.id}
                onAction={() => { void handleForceCancel(slot); }}
              >
                Force cancellation
              </MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <>
      <ConnectionNotice isOffline={isOffline} onRetry={reload} />
      <Table
        caption="Appointment status and admin cancellation controls"
        columns={columns}
        items={upcomingSlots}
        getRowId={slot => slot.id}
        emptyMessage="No appointments available."
        aria-busy={loadingSlotId !== null}
        className={styles.table}
      />
    </>
  );
}

