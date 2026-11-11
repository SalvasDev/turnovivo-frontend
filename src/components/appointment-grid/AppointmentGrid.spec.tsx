import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentGrid from './AppointmentGrid';
import { AppointmentSlot } from '@/types';
import { ApiError, apiService } from '@/services/api';

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

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    apiService: {
      getAvailableSlots: vi.fn(),
      bookAppointment: vi.fn(),
      cancelAppointment: vi.fn(),
    },
  };
});

// Fixture dates are in November 2026; pin "today" so they never become past dates.
vi.mock('@internationalized/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@internationalized/date')>();
  return { ...actual, today: () => actual.parseDate('2026-11-12') };
});

const NOW = Date.parse('2026-11-12T18:00:00Z');
const clock = vi.hoisted(() => ({ now: 0, read: 0 }));
vi.mock('@/hooks/useNow', () => ({ useNow: () => clock.now, readNow: () => clock.read }));

describe('AppointmentGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clock.now = NOW;
    clock.read = NOW;
    vi.mocked(apiService.getAvailableSlots).mockReturnValue(new Promise(() => {}));
  });

  const slotAt = (id: string, startTime: string): AppointmentSlot => ({
    id, businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
    startTime, endTime: new Date(Date.parse(startTime) + 30 * 60_000).toISOString(),
    appointment: null, waitlistEntries: [], slotBlocks: [],
  });

  it('completes a booking with the keyboard only: date picker, slot button and confirmation', async () => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    vi.mocked(apiService.bookAppointment).mockResolvedValue({ id: 'app-1', customerId: 'customer-1' });
    render(<AppointmentGrid
      initialSlots={[slotAt('day-13', '2026-11-13T16:00:00Z'), slotAt('day-14', '2026-11-14T16:00:00Z')]}
      businessId="biz-1"
      serverUserId="customer-1"
    />);

    await user.tab();
    expect(screen.getByRole('spinbutton', { name: /^month,/i })).toHaveFocus();
    await user.keyboard('11132026');
    expect(screen.getAllByRole('article')).toHaveLength(1);

    const reserve = screen.getByRole('button', { name: 'Reserve' });
    expect(reserve.tagName).toBe('BUTTON');
    for (let step = 0; step < 10 && document.activeElement !== reserve; step += 1) await user.tab();
    expect(reserve).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(apiService.bookAppointment).toHaveBeenCalledWith('day-13');
    expect(await screen.findByRole('status', { name: 'Booking confirmed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel appointment' })).toBeEnabled();
  });

  it('hides slots of today that already started and keeps the later ones', () => {
    render(<AppointmentGrid
      initialSlots={[slotAt('earlier-today', '2026-11-12T16:00:00Z'), slotAt('later-today', '2026-11-12T20:00:00Z')]}
      businessId="biz-1"
      serverUserId="customer-1"
    />);

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('2:00 PM');
  });

  it('groups a late-night slot under its business day across a month change', () => {
    render(<AppointmentGrid initialSlots={[slotAt('month-end', '2026-12-01T05:30:00Z')]} businessId="biz-1" serverUserId="customer-1" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Monday, November 30' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('11:30 PM');
  });

  it('refuses to book a slot that started after the last clock tick', async () => {
    mockedCookiesGet.mockReturnValue('token-123');
    const startingSoon = slotAt('starting-soon', '2026-11-12T18:00:20Z');
    render(<AppointmentGrid initialSlots={[startingSoon]} businessId="biz-1" serverUserId="customer-1" />);
    clock.read = Date.parse('2026-11-12T18:00:25Z');

    await userEvent.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(mockedUI.warning).toHaveBeenCalledWith('This time has already started. Choose a later slot.');
    expect(apiService.bookAppointment).not.toHaveBeenCalled();
  });

  it('marks each calendar day with its availability before the user selects it', async () => {
    const user = userEvent.setup();
    const base = { businessId: 'biz-1', staffId: 'staff-1', waitlistEntries: [], slotBlocks: [] };
    const slots: AppointmentSlot[] = [
      { ...base, id: 'open', status: 'AVAILABLE', startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z', appointment: null },
      { ...base, id: 'full', status: 'RESERVED', startTime: '2026-11-14T10:00:00Z', endTime: '2026-11-14T10:30:00Z', appointment: { id: 'a-2', customerId: 'other' } },
      { ...base, id: 'blocked', status: 'AVAILABLE', startTime: '2026-11-15T10:00:00Z', endTime: '2026-11-15T10:30:00Z', appointment: null, slotBlocks: [{ customerId: 'customer-1', reason: 'CANCELLED' }] },
      { ...base, id: 'past', status: 'AVAILABLE', startTime: '2026-11-10T10:00:00Z', endTime: '2026-11-10T10:30:00Z', appointment: null },
    ];
    render(<AppointmentGrid initialSlots={slots} businessId="biz-1" serverUserId="customer-1" />);

    await user.click(screen.getByRole('button', { name: /choose date/i }));
    const day = (n: number) => screen.getByRole('button', { name: new RegExp(`November ${n}, 2026`) });

    expect(day(13)).toHaveAttribute('data-availability', 'available');
    expect(day(13)).toHaveAccessibleDescription('Available');
    expect(day(14)).toHaveAttribute('data-availability', 'waitlist');
    expect(day(14)).toHaveAccessibleDescription('Full, waitlist only');
    expect(day(14)).not.toHaveAttribute('aria-disabled');
    expect(day(15)).toHaveAttribute('data-availability', 'blocked');
    expect(day(15)).toHaveAttribute('aria-disabled', 'true');
    expect(day(16)).toHaveAttribute('data-availability', 'none');
    expect(day(16)).toHaveAccessibleDescription('No appointments');
    expect(day(16)).toHaveAttribute('aria-disabled', 'true');
    expect(day(10)).toHaveAttribute('data-availability', 'past');
    expect(day(10)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('list', { name: 'Legend' })).toBeInTheDocument();

    await user.click(day(16));
    // The Nov 10 slot already started, so only the three upcoming ones remain.
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(3);
  });

  it('shows simple slot skeletons while the initial availability request is pending', () => {
    render(<AppointmentGrid initialSlots={[]} businessId="biz-1" serverUserId="customer-1" />);

    expect(screen.getByRole('status', { name: 'Loading appointment slots' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('status', { name: 'Loading appointment slots' })[0].querySelectorAll('[data-variant="rectangular"]')).toHaveLength(4);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose date/i })).toBeInTheDocument();
  });

  it('muestra warning y no reserva si ya tengo una reserva activa', async () => {
    mockedCookiesGet.mockReturnValue('token-123');

    const slots: AppointmentSlot[] = [
      {
        id: 'reserved-mine',
        businessId: 'biz-1',
        staffId: 'staff-1',
        status: 'RESERVED',
        startTime: '2026-11-19T10:00:00.000Z',
        endTime: '2026-11-19T10:30:00.000Z',
        appointment: { customerId: 'customer-1', id: 'app-1' },
        waitlistEntries: [],
        slotBlocks: [],
      },
      {
        id: 'available-1',
        businessId: 'biz-1',
        staffId: 'staff-2',
        status: 'AVAILABLE',
        startTime: '2026-11-19T11:00:00.000Z',
        endTime: '2026-11-19T11:30:00.000Z',
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
      'You can only have one active booking at a time.',
    );
    expect(apiService.bookAppointment).not.toHaveBeenCalled();
    expect(apiService.getAvailableSlots).toHaveBeenCalledWith('biz-1', undefined, expect.any(AbortSignal));
  });

  it('redirecciona a login y muestra info si no hay token', async () => {
    mockedCookiesGet.mockReturnValue(undefined);

    const slots: AppointmentSlot[] = [
      {
        id: 'available-1',
        businessId: 'biz-1',
        staffId: 'staff-2',
        status: 'AVAILABLE',
        startTime: '2026-11-19T11:00:00.000Z',
        endTime: '2026-11-19T11:30:00.000Z',
        appointment: null,
        waitlistEntries: [],
        slotBlocks: [],
      },
    ];

    render(<AppointmentGrid initialSlots={slots} businessId="biz-1" serverUserId="customer-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(mockedUI.info).toHaveBeenCalledWith('Sign in to manage appointments.');
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

    expect(apiService.bookAppointment).toHaveBeenCalledWith('available-1');
    expect(await screen.findByRole('button', { name: 'Cancel appointment' })).toBeEnabled();
    expect(screen.getByText('Your turn').parentElement).toHaveAttribute('data-appearance', 'solid');
    const summary = screen.getByRole('status', { name: 'Booking confirmed' });
    expect(screen.getByRole('button', { name: 'View appointment' })).toBeInTheDocument();
    expect(summary).toHaveTextContent('Friday, November 13');
    expect(summary).toHaveTextContent(/\d{1,2}:\d{2} – \d{1,2}:\d{2} AM/);
    expect(summary).toHaveTextContent('staff-1');
    expect(summary).toHaveTextContent('30 minutes');
    expect(mockedUI.success).toHaveBeenCalledWith('Appointment booked.');
  });

  it('refreshes availability and explains when another customer booked the slot first', async () => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    const availableSlot: AppointmentSlot = {
      id: 'racing-slot', businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: null, waitlistEntries: [], slotBlocks: [],
    };
    const slotTaken: AppointmentSlot = {
      ...availableSlot,
      status: 'RESERVED',
      appointment: { id: 'other-appointment', customerId: 'another-customer' },
    };
    vi.mocked(apiService.getAvailableSlots)
      .mockReturnValueOnce(new Promise(() => {}))
      .mockResolvedValueOnce([slotTaken]);
    vi.mocked(apiService.bookAppointment).mockRejectedValue(
      new ApiError('This appointment slot is no longer available.', 409),
    );
    render(<AppointmentGrid initialSlots={[availableSlot]} businessId="biz-1" serverUserId="customer-1" />);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    await waitFor(() => expect(apiService.getAvailableSlots).toHaveBeenCalledTimes(2));
    expect(apiService.getAvailableSlots).toHaveBeenLastCalledWith('biz-1', undefined, expect.any(AbortSignal));
    expect(await screen.findByText('Busy')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reserve' })).not.toBeInTheDocument();
    expect(mockedUI.warning).toHaveBeenCalledWith(
      'Someone just booked this time. Availability has been updated; choose another slot.',
    );
    expect(mockedUI.error).not.toHaveBeenCalled();
  });

  it('ignores repeated presses while a booking request is pending', async () => {
    const user = userEvent.setup();
    mockedCookiesGet.mockReturnValue('token-123');
    vi.mocked(apiService.bookAppointment).mockReturnValue(new Promise(() => {}));
    const slot: AppointmentSlot = {
      id: 'available-1', businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: null, waitlistEntries: [], slotBlocks: [],
    };
    render(<AppointmentGrid initialSlots={[slot]} businessId="biz-1" serverUserId="customer-1" />);

    const reserve = screen.getByRole('button', { name: 'Reserve' });
    await user.dblClick(reserve);
    await user.click(reserve);

    expect(apiService.bookAppointment).toHaveBeenCalledTimes(1);
  });

  it('offers Retry after a network failure and updates availability', async () => {
    const user = userEvent.setup();
    const slot: AppointmentSlot = {
      id: 'available-1', businessId: 'biz-1', staffId: 'staff-1', status: 'AVAILABLE',
      startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
      appointment: null, waitlistEntries: [], slotBlocks: [],
    };
    vi.mocked(apiService.getAvailableSlots)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce([slot]);
    render(<AppointmentGrid initialSlots={[slot]} businessId="biz-1" serverUserId="customer-1" />);

    expect(await screen.findByText(/Connection lost/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(apiService.getAvailableSlots).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Connection lost/)).not.toBeInTheDocument();
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

    expect(apiService.bookAppointment).toHaveBeenCalledWith('new-slot');
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
    expect(apiService.bookAppointment).toHaveBeenCalledWith('available-slot');
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
    await waitFor(() => expect(apiService.cancelAppointment).toHaveBeenCalledWith('app-1'));
    await act(async () => { resolveOldPoll(staleSlots); });

    expect(screen.queryByText('Your turn')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View appointment' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelled' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    expect(apiService.bookAppointment).toHaveBeenCalledWith('available-slot');
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
    expect(screen.getByRole('status', { name: 'Booking confirmed' })).toBeInTheDocument();

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
        startTime: '2026-11-13T17:00:00Z', endTime: '2026-11-13T17:30:00Z',
        appointment: null, waitlistEntries: [], slotBlocks: [],
      };
      render(<AppointmentGrid initialSlots={[slot]} businessId="biz-1" serverUserId="customer-1" />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title.textContent).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', `Appointment ${title.textContent}: available`);
    } finally {
      formatterSpy.mockRestore();
    }
  });
});
