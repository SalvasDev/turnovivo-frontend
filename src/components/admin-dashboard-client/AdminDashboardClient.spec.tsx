import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppointmentSlot } from '@/types';
import { apiService } from '@/services/api';
import { UIProvider } from '@/context/UIContext';
import AdminDashboardClient from './AdminDashboardClient';

vi.mock('@/services/api', () => ({
  apiService: { getAvailableSlots: vi.fn(), cancelAppointment: vi.fn() },
}));

// Fixtures are on 2026-11-13; a pinned clock keeps them upcoming.
vi.mock('@/hooks/useNow', () => ({ useNow: () => Date.parse('2026-11-12T18:00:00Z') }));

const reservedSlot: AppointmentSlot = {
  id: 'reserved-slot', businessId: 'business-1', staffId: 'staff-1', status: 'RESERVED',
  startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
  appointment: { id: 'appointment-1', customerId: 'customer-1' },
};

function renderDashboard(slots: AppointmentSlot[] = [reservedSlot]) {
  return render(<UIProvider><AdminDashboardClient initialSlots={slots} businessId="business-1" /></UIProvider>);
}

async function openCancelDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Actions for/ }));
  await user.click(screen.getByRole('menuitem', { name: 'Force cancellation' }));
  return screen.getByRole('alertdialog', { name: 'Force cancellation' });
}

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(apiService.getAvailableSlots).mockResolvedValue([reservedSlot]);
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the Figma columns, DS badge and three-dot menu trigger', () => {
    renderDashboard();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map(cell => cell.textContent)).toEqual(['Date', 'Slot', 'Status', 'Client ID', 'Actions']);
    expect(within(table).getByRole('columnheader', { name: 'Actions' }).firstElementChild?.className).toMatch(/srOnly/);
    expect(screen.getByRole('rowheader')).toHaveTextContent('Fri, Nov 13');
    expect(screen.getByText('Reserved').parentElement).toHaveAttribute('data-color', 'error');
    expect(screen.getByText('customer-1')).toHaveAttribute('title', 'customer-1');
    const icon = screen.getByRole('button', { name: /^Actions for Fri, Nov 13/ }).querySelector('svg');
    expect(icon).toHaveAttribute('viewBox', '0 0 4 16');
    expect(icon?.querySelectorAll('path')).toHaveLength(3);
    const tableColumns = table.querySelectorAll('col');
    expect(tableColumns[2]).toHaveStyle({ width: '15%' });
    expect(tableColumns[4]).toHaveStyle({ width: '9%' });
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('opens the destructive ConfirmDialog and does not cancel when rejected', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const dialog = await openCancelDialog(user);
    expect(dialog).toHaveAttribute('data-variant', 'destructive');
    expect(apiService.cancelAppointment).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Go back' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(apiService.cancelAppointment).not.toHaveBeenCalled();
  });

  it('uses the existing cancellation API only after confirmation and blocks duplicate actions', async () => {
    const user = userEvent.setup();
    let finishCancellation!: (value: { message: string }) => void;
    vi.mocked(apiService.cancelAppointment).mockReturnValue(new Promise(resolve => { finishCancellation = resolve; }));
    renderDashboard();
    const dialog = await openCancelDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel' }));

    expect(apiService.cancelAppointment).toHaveBeenCalledExactlyOnceWith('appointment-1');
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: /^Actions for/ })).toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Cancelling appointment' })).toBeInTheDocument();
    expect(screen.getByText('Cancelling appointment...')).toBeInTheDocument();

    await act(async () => { finishCancellation({ message: 'Slot released' }); });
    expect(screen.getByText('Appointment cancelled by admin. Slot released')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: /^Actions for/ })).toBeEnabled();
  });

  it('shows API errors through the DS Toast and allows retry', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.cancelAppointment).mockRejectedValue(new Error('Unable to cancel'));
    renderDashboard();
    const dialog = await openCancelDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to cancel');
    expect(screen.getByRole('button', { name: /^Actions for/ })).toBeEnabled();
  });

  it.each(['AVAILABLE', 'HOLD', 'NO_APPOINTMENT'] as const)('disables force cancellation for %s', async (state) => {
    const user = userEvent.setup();
    const slot: AppointmentSlot = {
      ...reservedSlot,
      status: state === 'NO_APPOINTMENT' ? 'RESERVED' : state,
      appointment: state === 'NO_APPOINTMENT' || state === 'AVAILABLE' ? null : reservedSlot.appointment,
    };
    renderDashboard([slot]);
    await user.click(screen.getByRole('button', { name: /^Actions for/ }));
    const cancel = screen.getByRole('menuitem', { name: 'Force cancellation' });
    expect(cancel).toHaveAttribute('aria-disabled', 'true');
    await user.click(cancel);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(apiService.cancelAppointment).not.toHaveBeenCalled();
  });

  it('supports keyboard opening and Escape with focus restoration', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const trigger = screen.getByRole('button', { name: /^Actions for/ });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const action = await screen.findByRole('menuitem', { name: 'Force cancellation' });
    await waitFor(() => expect(action).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps authenticated polling and updates the table without cancelling', async () => {
    vi.useFakeTimers();
    vi.mocked(apiService.getAvailableSlots).mockResolvedValue([{ ...reservedSlot, status: 'AVAILABLE', appointment: null }]);
    renderDashboard();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(apiService.getAvailableSlots).toHaveBeenCalledWith('business-1', { auth: true }, expect.any(AbortSignal));
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('customer-1')).not.toBeInTheDocument();
    expect(apiService.cancelAppointment).not.toHaveBeenCalled();
  });

  it('offers Retry after a network failure and keeps the table data until recovery', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.getAvailableSlots)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce([reservedSlot]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Connection lost/)).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByText('customer-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(apiService.getAvailableSlots).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Connection lost/)).not.toBeInTheDocument();
    expect(screen.getByText('customer-1')).toBeInTheDocument();
  });
});