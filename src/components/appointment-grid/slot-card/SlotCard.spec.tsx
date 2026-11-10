import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { AppointmentSlot } from '@/types';
import SlotCard from './SlotCard';

const availableSlot: AppointmentSlot = {
  id: 'slot-1', businessId: 'business-1', staffId: 'staff-1', status: 'AVAILABLE',
  startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
  appointment: null, waitlistEntries: [], slotBlocks: [],
};

function renderSlot(overrides: Partial<ComponentProps<typeof SlotCard>> = {}) {
  const props: ComponentProps<typeof SlotCard> = {
    slot: availableSlot, serverUserId: 'customer-1', myBookedSlotId: null,
    myWaitlistSlotIds: [], localBlocks: {}, loadingSlotId: null,
    formatTime: () => '10:00 a.m.',
    onSlotAction: vi.fn(), onCancelAppointment: vi.fn(), onLeaveWaitlist: vi.fn(),
    ...overrides,
  };
  render(<SlotCard {...props} />);
  return props;
}

describe('SlotCard using the design system Card', () => {
  it('renders the DS badge, heading and booking action', async () => {
    const user = userEvent.setup();
    const props = renderSlot();
    expect(screen.getByRole('listitem', { name: /available/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '10:00 a.m.' })).toBeInTheDocument();
    expect(screen.getByText('Available').parentElement).toHaveAttribute('data-color', 'success');
    const button = screen.getByRole('button', { name: 'Reserve' });
    expect(button).toHaveAttribute('data-variant', 'filled');
    await user.click(button);
    expect(props.onSlotAction).toHaveBeenCalledWith(availableSlot);
  });

  it('cancels the current user booking', async () => {
    const user = userEvent.setup();
    const slot = { ...availableSlot, status: 'RESERVED' as const, appointment: { id: 'appointment-1', customerId: 'customer-1' } };
    const props = renderSlot({ slot });
    expect(screen.getByText('Your turn').parentElement).toHaveAttribute('data-appearance', 'solid');
    await user.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    expect(props.onCancelAppointment).toHaveBeenCalledWith(slot);
    expect(props.onSlotAction).not.toHaveBeenCalled();
  });

  it('joins the waitlist when a slot belongs to another customer', async () => {
    const user = userEvent.setup();
    const slot = { ...availableSlot, status: 'RESERVED' as const, appointment: { customerId: 'customer-2' } };
    const props = renderSlot({ slot });
    await user.click(screen.getByRole('button', { name: 'Join waitlist' }));
    expect(props.onSlotAction).toHaveBeenCalledWith(slot);
  });

  it.each(['server', 'local'])('leaves the waitlist derived from %s state', async (source) => {
    const user = userEvent.setup();
    const props = renderSlot({
      slot: { ...availableSlot, status: 'RESERVED', waitlistEntries: source === 'server' ? [{ customerId: 'customer-1' }] : [] },
      myWaitlistSlotIds: source === 'local' ? ['slot-1'] : [],
    });
    expect(screen.getByText('Waiting').parentElement).toHaveAttribute('data-color', 'warning');
    await user.click(screen.getByRole('button', { name: 'Leave waitlist' }));
    expect(props.onLeaveWaitlist).toHaveBeenCalledWith('slot-1');
    expect(props.onSlotAction).not.toHaveBeenCalled();
  });

  it.each(['CANCELLED', 'DECLINED'] as const)('keeps %s slots blocked', async (reason) => {
    const user = userEvent.setup();
    const props = renderSlot({ localBlocks: { 'slot-1': reason } });
    const button = screen.getByRole('button', { name: reason === 'CANCELLED' ? 'Cancelled' : 'Declined' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(props.onSlotAction).not.toHaveBeenCalled();
  });

  it('preserves server block precedence over local state and ownership', () => {
    renderSlot({
      slot: { ...availableSlot, status: 'RESERVED', appointment: { customerId: 'customer-1' }, slotBlocks: [{ customerId: 'customer-1', reason: 'CANCELLED' }] },
      localBlocks: { 'slot-1': 'DECLINED' }, myBookedSlotId: 'slot-1',
    });
    expect(screen.getByRole('button', { name: 'Cancelled' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Cancel appointment' })).not.toBeInTheDocument();
  });

  it.each(['customer-1', 'customer-2'])('keeps HOLD actions disabled for %s', (customerId) => {
    renderSlot({ slot: { ...availableSlot, status: 'HOLD', appointment: { customerId } } });
    expect(screen.getByRole('button', { name: customerId === 'customer-1' ? 'On hold for you' : 'Join waitlist' })).toBeDisabled();
  });

  it('keeps waitlist entry blocked when the user has another booking', () => {
    renderSlot({ slot: { ...availableSlot, status: 'RESERVED' }, myBookedSlotId: 'another-slot' });
    expect(screen.getByRole('button', { name: 'Blocked' })).toBeDisabled();
  });

  it('preserves booking policy feedback by leaving available slots actionable', async () => {
    const user = userEvent.setup();
    const props = renderSlot({ myBookedSlotId: 'another-slot' });
    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    expect(props.onSlotAction).toHaveBeenCalledWith(availableSlot);
  });

  it('announces pending work and prevents duplicate actions', async () => {
    const user = userEvent.setup();
    const props = renderSlot({ loadingSlotId: 'slot-1' });
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
    const button = screen.getByRole('button', { name: 'Booking...' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(props.onSlotAction).not.toHaveBeenCalled();
  });

  it('disables other slots while an action is pending', () => {
    renderSlot({ loadingSlotId: 'another-slot' });
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeDisabled();
    expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-busy', 'true');
  });
});