import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentGrid from './AppointmentGrid';
import { AppointmentSlot } from '@/types';
import { apiService } from '@/services/api';

const mockedCookiesGet = vi.fn();
const mockedUI = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(() => vi.fn()),
  confirm: vi.fn(),
};

vi.mock('js-cookie', () => ({
  default: {
    get: (...args: unknown[]) => mockedCookiesGet(...args),
  },
}));

vi.mock('@/context/UIContext', () => ({
  useUI: () => mockedUI,
}));

vi.mock('@/services/api', () => ({
  apiService: {
    getAvailableSlots: vi.fn(),
    bookAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
  },
}));

describe('AppointmentGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getAvailableSlots).mockReturnValue(new Promise(() => {}));
  });

  it('muestra warning y no reserva si ya tengo una reserva activa', async () => {
    mockedCookiesGet.mockReturnValue('token-123');

    const slots: AppointmentSlot[] = [
      {
        id: 'reserved-mine',
        businessId: 'biz-1',
        staffId: 'staff-1',
        status: 'RESERVED',
        startTime: '2026-06-19T10:00:00.000Z',
        endTime: '2026-06-19T10:30:00.000Z',
        appointment: { customerId: 'customer-1', id: 'app-1' },
        waitlistEntries: [],
        slotBlocks: [],
      },
      {
        id: 'available-1',
        businessId: 'biz-1',
        staffId: 'staff-2',
        status: 'AVAILABLE',
        startTime: '2026-06-19T11:00:00.000Z',
        endTime: '2026-06-19T11:30:00.000Z',
        appointment: null,
        waitlistEntries: [],
        slotBlocks: [],
      },
    ];

    render(<AppointmentGrid initialSlots={slots} businessId="biz-1" serverUserId="customer-1" />);

    expect(screen.getByText('Your turn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel appointment' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(mockedUI.warning).toHaveBeenCalledWith(
      'Politica de la empresa: solo puedes tener una reserva activa a la vez.',
    );
    expect(apiService.bookAppointment).not.toHaveBeenCalled();
    expect(apiService.getAvailableSlots).toHaveBeenCalledWith('biz-1');
  });

  it('redirecciona a login y muestra info si no hay token', async () => {
    mockedCookiesGet.mockReturnValue(undefined);

    const slots: AppointmentSlot[] = [
      {
        id: 'available-1',
        businessId: 'biz-1',
        staffId: 'staff-2',
        status: 'AVAILABLE',
        startTime: '2026-06-19T11:00:00.000Z',
        endTime: '2026-06-19T11:30:00.000Z',
        appointment: null,
        waitlistEntries: [],
        slotBlocks: [],
      },
    ];

    render(<AppointmentGrid initialSlots={slots} businessId="biz-1" serverUserId="customer-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(mockedUI.info).toHaveBeenCalledWith('Debes iniciar sesion para realizar esta accion.');
  });

  it('actualiza la Card del design system al completar una reserva', async () => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    vi.mocked(apiService.bookAppointment).mockResolvedValue({ id: 'app-1', customerId: 'customer-1' });
    const slot: AppointmentSlot = {
      id: 'available-1', businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: null, waitlistEntries: [], slotBlocks: [],
    };
    render(<AppointmentGrid initialSlots={[slot]} businessId="biz-1" serverUserId="customer-1" />);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(apiService.bookAppointment).toHaveBeenCalledWith('available-1', 'token-123');
    expect(await screen.findByRole('button', { name: 'Cancel appointment' })).toBeEnabled();
    expect(screen.getByText('Your turn').parentElement).toHaveAttribute('data-appearance', 'solid');
    expect(mockedUI.success).toHaveBeenCalledWith('Cita agendada con exito.');
  });

  it.each(['cancelled', 'available'] as const)('no cuenta como reserva activa un slot %s con una cita anterior', async (state) => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    vi.mocked(apiService.bookAppointment).mockResolvedValue({ id: 'new-appointment', customerId: 'customer-1' });
    const previousSlot: AppointmentSlot = {
      id: 'old-slot', businessId: 'biz-1', staffId: 'staff-1',
      status: state === 'cancelled' ? 'RESERVED' : 'AVAILABLE',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: { id: 'old-appointment', customerId: 'customer-1' },
      slotBlocks: state === 'cancelled' ? [{ customerId: 'customer-1', reason: 'CANCELLED' }] : [],
    };
    const availableSlot: AppointmentSlot = {
      ...previousSlot, id: 'new-slot', status: 'AVAILABLE', appointment: null, slotBlocks: [],
      startTime: '2026-11-13T11:00:00Z', endTime: '2026-11-13T11:30:00Z',
    };
    render(<AppointmentGrid initialSlots={[previousSlot, availableSlot]} businessId="biz-1" serverUserId="customer-1" />);

    await user.click(screen.getAllByRole('button', { name: 'Reserve' }).at(-1)!);

    expect(apiService.bookAppointment).toHaveBeenCalledWith('new-slot', 'token-123');
    expect(mockedUI.warning).not.toHaveBeenCalled();
  });

  it('el sondeo elimina una reserva que el servidor marca bloqueada', async () => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    const mine: AppointmentSlot = {
      id: 'my-slot', businessId: 'biz-1', staffId: 'staff-1', status: 'RESERVED',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: { id: 'app-1', customerId: 'customer-1' }, slotBlocks: [],
    };
    const available: AppointmentSlot = { ...mine, id: 'available-slot', status: 'AVAILABLE', appointment: null };
    vi.mocked(apiService.getAvailableSlots).mockResolvedValue([
      { ...mine, slotBlocks: [{ customerId: 'customer-1', reason: 'CANCELLED' }] }, available,
    ]);
    vi.mocked(apiService.bookAppointment).mockReturnValue(new Promise(() => {}));
    render(<AppointmentGrid initialSlots={[mine, available]} businessId="biz-1" serverUserId="customer-1" />);

    await waitFor(() => expect(screen.queryByText('Your turn')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'View appointment' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    expect(apiService.bookAppointment).toHaveBeenCalledWith('available-slot', 'token-123');
    expect(mockedUI.warning).not.toHaveBeenCalled();
  });

  it('no restaura una reserva cancelada cuando llega un sondeo antiguo', async () => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    mockedUI.confirm.mockResolvedValue(true);
    vi.mocked(apiService.cancelAppointment).mockResolvedValue({});
    vi.mocked(apiService.bookAppointment).mockReturnValue(new Promise(() => {}));
    const mine: AppointmentSlot = {
      id: 'my-slot', businessId: 'biz-1', staffId: 'staff-1', status: 'RESERVED',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: { id: 'app-1', customerId: 'customer-1' }, slotBlocks: [],
    };
    const available: AppointmentSlot = { ...mine, id: 'available-slot', status: 'AVAILABLE', appointment: null };
    const staleSlots = [mine, available];
    let resolveOldPoll!: (slots: AppointmentSlot[]) => void;
    vi.mocked(apiService.getAvailableSlots)
      .mockReturnValueOnce(new Promise((resolve) => { resolveOldPoll = resolve; }))
      .mockResolvedValue(staleSlots);
    render(<AppointmentGrid initialSlots={staleSlots} businessId="biz-1" serverUserId="customer-1" />);

    await user.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    await waitFor(() => expect(apiService.cancelAppointment).toHaveBeenCalledWith('app-1', 'token-123'));
    await act(async () => { resolveOldPoll(staleSlots); });

    expect(screen.queryByText('Your turn')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View appointment' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelled' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    expect(apiService.bookAppointment).toHaveBeenCalledWith('available-slot', 'token-123');
    expect(mockedUI.warning).not.toHaveBeenCalled();
  });

  it('permite encontrar la reserva propia aunque el filtro muestre otro dia', async () => {
    const user = userEvent.setup();
    const mine: AppointmentSlot = {
      id: 'my-slot', businessId: 'biz-1', staffId: 'staff-1', status: 'RESERVED',
      startTime: '2026-11-14T10:00:00Z', endTime: '2026-11-14T10:30:00Z',
      appointment: { id: 'app-1', customerId: 'customer-1' }, slotBlocks: [],
    };
    const available: AppointmentSlot = {
      ...mine, id: 'available-slot', status: 'AVAILABLE', appointment: null,
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
    };
    render(<AppointmentGrid initialSlots={[mine, available]} businessId="biz-1" serverUserId="customer-1" />);
    await user.click(screen.getByRole('spinbutton', { name: /^day,/i }));
    await user.keyboard('13');
    await user.click(screen.getByRole('spinbutton', { name: /^month,/i }));
    await user.keyboard('11');
    await user.click(screen.getByRole('spinbutton', { name: /^year,/i }));
    await user.keyboard('2026');
    expect(screen.queryByText('Your turn')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Your appointment:');

    await user.click(screen.getByRole('button', { name: 'View appointment' }));

    expect(screen.getByText('Your turn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel appointment' })).toBeEnabled();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(apiService.bookAppointment).not.toHaveBeenCalled();
  });

  it('filtra por fecha y Clear restaura todos los horarios sin reservar', async () => {
    const user = userEvent.setup();
    const slots: AppointmentSlot[] = [13, 14].map((day) => ({
      id: `slot-${day}`, businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
      startTime: `2026-11-${day}T10:00:00Z`, endTime: `2026-11-${day}T10:30:00Z`,
      appointment: null, waitlistEntries: [], slotBlocks: [],
    }));
    render(<AppointmentGrid initialSlots={slots} businessId="biz-1" serverUserId="customer-1" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('spinbutton', { name: /^day,/i }));
    await user.keyboard('13');
    await user.click(screen.getByRole('spinbutton', { name: /^month,/i }));
    await user.keyboard('11');
    await user.click(screen.getByRole('spinbutton', { name: /^year,/i }));
    await user.keyboard('2026');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('list')).toHaveAccessibleName(/13/);
    await user.click(screen.getByRole('button', { name: 'Clear: Appointment date' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(apiService.bookAppointment).not.toHaveBeenCalled();
  });

  it.each([' ', '\u202f', '\u00a0'])('normaliza el separador Intl %j para evitar diferencias de hidratacion', (separator) => {
    const originalFormatToParts = Intl.DateTimeFormat.prototype.formatToParts;
    const formatterSpy = vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
      .mockImplementation(function (this: Intl.DateTimeFormat, date) {
        const parts = originalFormatToParts.call(this, date);
        return parts.some((part) => part.type === 'dayPeriod')
          ? parts.map((part) => part.type === 'literal' && /^\s+$/.test(part.value)
            ? { ...part, value: separator } : part)
          : parts;
      });
    try {
      const slot: AppointmentSlot = {
        id: 'slot-1', businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
        startTime: '2026-11-09T17:00:00Z', endTime: '2026-11-09T17:30:00Z',
        appointment: null, waitlistEntries: [], slotBlocks: [],
      };
      render(<AppointmentGrid initialSlots={[slot]} businessId="biz-1" serverUserId="customer-1" />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title.textContent).toMatch(/^\d{2}:\d{2} [AP]\.M\.$/);
      expect(screen.getByRole('listitem')).toHaveAttribute('aria-label', `Appointment ${title.textContent}: available`);
    } finally {
      formatterSpy.mockRestore();
    }
  });
});
