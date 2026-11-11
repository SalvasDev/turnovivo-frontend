import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';
import type { ToastVariant } from './Toast.types';

describe('Toast', () => {
  it.each<ToastVariant>(['success', 'info', 'warning', 'error', 'loading'])('renders the %s variant and announcement priority', (variant) => {
    render(<Toast variant={variant}>Appointment in line</Toast>);
    const toast = screen.getByRole(variant === 'error' ? 'alert' : 'status');
    expect(toast).toHaveAttribute('data-variant', variant);
    expect(toast).toHaveAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
    expect(toast).toHaveTextContent('Appointment in line');
    expect(toast.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
  });

  it('calls the dismiss handler by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Toast onDismiss={onDismiss}>Appointment in line</Toast>);
    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    await user.click(close);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    close.focus();
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('can hide the icon and the dismiss action', () => {
    const { container } = render(<Toast showIcon={false} isDismissible={false} onDismiss={vi.fn()}>Message</Toast>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('does not render an inert dismiss action without a handler', () => {
    render(<Toast>Message</Toast>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('accepts custom classes, attributes and a translated dismiss label', () => {
    render(<Toast id="booking-toast" className="custom-toast" dismissLabel="Dismiss notification" onDismiss={vi.fn()}>Message</Toast>);
    expect(screen.getByRole('status')).toHaveAttribute('id', 'booking-toast');
    expect(screen.getByRole('status')).toHaveClass('custom-toast');
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });
});