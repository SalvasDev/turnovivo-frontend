import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import type { ConfirmDialogVariant } from './ConfirmDialog.types';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <ConfirmDialog
        isOpen={open}
        title="Cancel appointment?"
        description="You will cancel your appointment"
        variant="destructive"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it.each<ConfirmDialogVariant>(['confirm', 'info', 'destructive'])('renders the %s variant with an accessible title and description', (variant) => {
    render(
      <ConfirmDialog isOpen title="Cancel appointment?" description="You will cancel your appointment" variant={variant} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Cancel appointment?' });
    expect(dialog).toHaveAccessibleDescription('You will cancel your appointment');
    expect(dialog).toHaveAttribute('data-variant', variant);
    expect(screen.getByRole('button', { name: variant === 'info' ? 'OK' : 'Confirm' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Cancel' }) !== null).toBe(variant !== 'info');
  });

  it('does not render a closed dialog', () => {
    render(<ConfirmDialog isOpen={false} title="Confirm" description="Description" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('calls confirm and cancel independently with custom labels', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen title="Cancel appointment?" description="Description" confirmText="Yes, cancel" cancelText="Go back" onConfirm={onConfirm} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Yes, cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('focuses cancel, contains keyboard focus and restores the trigger on Escape', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(trigger);
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    await waitFor(() => expect(cancel).toHaveFocus());
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('focuses the acknowledgement action in the info variant', async () => {
    render(<ConfirmDialog isOpen title="Information" description="Description" variant="info" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus());
  });

  it('blocks actions and Escape while pending', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen title="Confirm" description="Description" isPending onConfirm={onConfirm} onCancel={onCancel} />);
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm.parentElement).toHaveAttribute('aria-busy', 'true');
    expect(confirm).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.click(confirm);
    await user.keyboard('{Escape}');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});