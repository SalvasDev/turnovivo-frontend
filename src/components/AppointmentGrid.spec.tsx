import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentGrid from './AppointmentGrid';
import { AppointmentSlot } from '@/types';

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

describe('AppointmentGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra warning y no hace fetch si ya tengo una reserva activa', async () => {
    mockedCookiesGet.mockReturnValue('token-123');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

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

    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(mockedUI.warning).toHaveBeenCalledWith(
      'Politica de la empresa: solo puedes tener una reserva activa a la vez.',
    );
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
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

    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(mockedUI.info).toHaveBeenCalledWith('Debes iniciar sesion para realizar esta accion.');
  });
});
