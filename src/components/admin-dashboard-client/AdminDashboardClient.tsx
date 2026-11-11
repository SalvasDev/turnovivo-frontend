'use client';

import { useState, useEffect } from 'react';
import { SlotStatus } from '@/types';
import { useUI } from '@/context/UIContext';
import { apiService, ApiMessage } from '@/services/api';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { Badge, Button, Icon, Table, type TableColumn } from '@/design-system';
import styles from './AdminDashboardClient.module.css';

interface AdminSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointment?: {
    id?: string;
    customerId?: string;
  } | null;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

interface AdminDashboardClientProps {
  initialSlots: AdminSlot[];
  businessId: string;
  token: string;
}

export default function AdminDashboardClient({ initialSlots, businessId, token }: AdminDashboardClientProps) {
  const { success, error, loading, confirm } = useUI();
  const [slots, setSlots] = useState<AdminSlot[]>(initialSlots);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);

  const formatTime = (isoString: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(new Date(isoString));
    return parts.map(part => part.type === 'dayPeriod'
      ? (part.value === 'AM' ? 'a.m.' : 'p.m.')
      : part.value.replace(/\s+/g, ' ')).join('');
  };
  const formatDate = (isoString: string) => new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoString));
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshSlots = (await apiService.getAvailableSlots(businessId, token)) as AdminSlot[];
        setSlots(freshSlots);
      } catch (err: unknown) {
        console.error('Error de red en sondeo de administración:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [businessId, token]);
  const handleForceCancel = async (slot: AdminSlot) => {
    if (loadingSlotId !== null) return;
    const appointmentId = slot.appointment?.id;

    if (!appointmentId) {
      error('Este bloque horario no tiene ninguna cita agendada activa.');
      return;
    }

    const shouldForceCancel = await confirm({
      title: 'Forzar cancelacion',
      description: `Estas seguro de forzar la cancelacion del turno de las ${formatTime(slot.startTime)}? Esto liberara el espacio o activara la cascada de Redis.`,
      confirmText: 'Si, cancelar',
      cancelText: 'No, volver',
      tone: 'danger',
    });

    if (!shouldForceCancel) {
      return;
    }

    setLoadingSlotId(slot.id);
    const stopLoadingToast = loading('Procesando cancelacion administrativa...');
    try {
      const data = (await apiService.cancelAppointment(appointmentId, token)) as ApiMessage;

      success(`Turno cancelado por administracion. ${data.message ?? ''}`.trim());
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Hubo un problema al cancelar el turno.');
      error(message);
    } finally {
      stopLoadingToast();
      setLoadingSlotId(null);
    }
  };

  const columns: TableColumn<AdminSlot>[] = [
    {
      id: 'date', header: 'Date', isRowHeader: true, width: '15%',
      renderCell: slot => <span className={styles.time}>{formatDate(slot.startTime)}</span>,
    },
    {
      id: 'slot', header: 'Slot', width: '25%',
      renderCell: slot => <span className={styles.time}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>,
    },
    {
      id: 'status', header: 'Status', width: '15%',
      renderCell: slot => (
        <Badge className={styles.status} color={slot.status === 'AVAILABLE' ? 'success' : slot.status === 'HOLD' ? 'warning' : 'error'}>
          {slot.status === 'AVAILABLE' ? 'Active' : slot.status === 'HOLD' ? 'Hold' : 'Reserved'}
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
            variant="text"
            className={styles.menuTrigger}
            aria-label={`Acciones del turno ${formatDate(slot.startTime)} ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
            isDisabled={loadingSlotId !== null}
          >
            <span title="Acciones del turno"><Icon name="moreVertical" /></span>
          </Button>
          <Popover placement="bottom end" offset={8} className={styles.popover}>
            <Menu aria-label="Acciones del turno" className={styles.menu}>
              <MenuItem
                className={styles.menuItem}
                isDisabled={loadingSlotId !== null || slot.status !== 'RESERVED' || !slot.appointment?.id}
                onAction={() => { void handleForceCancel(slot); }}
              >
                Forzar cancelacion
              </MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      ),
    },
  ];

  return (
    <Table
      caption="Estado operativo de turnos y controles de cancelacion administrativa"
      columns={columns}
      items={slots}
      getRowId={slot => slot.id}
      emptyMessage="No appointments available."
      aria-busy={loadingSlotId !== null}
      className={styles.table}
    />
  );
}

