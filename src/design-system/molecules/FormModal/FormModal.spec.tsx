import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormModal } from './FormModal';

function Harness({ isPending = false }: { isPending?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open form</button>
      <FormModal isOpen={open} title="New admin" isPending={isPending} onClose={() => setOpen(false)}>
        <input aria-label="Email" />
      </FormModal>
    </>
  );
}

describe('FormModal', () => {
  it('renders a dialog named by its title with an accessible close button', () => {
    render(<FormModal isOpen title="New admin" onClose={vi.fn()}><p>Body</p></FormModal>);
    const dialog = screen.getByRole('dialog', { name: 'New admin' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveAttribute('data-icon-only', 'true');
  });

  it('closes with Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open form' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FormModal isOpen title="New admin" onClose={onClose}><p>Body</p></FormModal>);
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocks dismissal and marks the content busy while pending', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FormModal isOpen isPending title="New admin" onClose={onClose}><p>Saving</p></FormModal>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled();
    expect(screen.getByText('Saving').parentElement).toHaveAttribute('aria-busy', 'true');
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});
