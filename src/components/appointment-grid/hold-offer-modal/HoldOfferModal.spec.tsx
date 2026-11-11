import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import HoldOfferModal from './HoldOfferModal';

describe('HoldOfferModal', () => {
  it('renders the offer with an accessible description and a non-interrupting countdown', () => {
    render(<HoldOfferModal countdown={30} onDecline={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('alertdialog', { name: 'A spot just opened up' })).toHaveAccessibleDescription('Claim or decline this appointment before the countdown ends.');
    expect(screen.getByRole('timer', { name: 'Time remaining' })).toHaveTextContent('00:30');
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '30');
  });

  it('updates the controlled countdown without dismissing or invoking callbacks', () => {
    const onDecline = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(<HoldOfferModal countdown={30} onDecline={onDecline} onConfirm={onConfirm} />);
    rerender(<HoldOfferModal countdown={9} onDecline={onDecline} onConfirm={onConfirm} />);
    expect(screen.getByRole('timer')).toHaveTextContent('00:09');
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '9');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '9 seconds');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('keeps focus inside and does not dismiss on Escape or an outside click', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    const onConfirm = vi.fn();
    render(<><button>Background action</button><HoldOfferModal countdown={20} onDecline={onDecline} onConfirm={onConfirm} /></>);
    const decline = screen.getByRole('button', { name: 'Decline' });
    await waitFor(() => expect(decline).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Claim' })).toHaveFocus();
    await user.tab();
    expect(decline).toHaveFocus();
    await user.keyboard('{Escape}');
    const dialog = screen.getByRole('alertdialog');
    await user.click(dialog.parentElement!.parentElement!);
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Background action' })).not.toBeInTheDocument();
    expect(onDecline).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('preserves both existing actions while the countdown is running', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    const onConfirm = vi.fn();
    render(<HoldOfferModal countdown={15} onDecline={onDecline} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Claim' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('locks both actions while a claim request is pending', async () => {
    const user = userEvent.setup();
    let resolveClaim!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { resolveClaim = resolve; }));
    const onDecline = vi.fn();
    render(<HoldOfferModal countdown={15} onDecline={onDecline} onConfirm={onConfirm} />);

    const claim = screen.getByRole('button', { name: 'Claim' });
    await user.click(claim);
    await user.click(claim);
    await user.click(screen.getByRole('button', { name: 'Decline' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
    expect(screen.getByRole('progressbar', { name: 'Claiming' })).toBeInTheDocument();

    resolveClaim();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Decline' })).toBeEnabled());
  });

  it('clamps expired countdowns and prevents claiming an expired offer', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<HoldOfferModal countdown={-1} onDecline={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByRole('timer')).toHaveTextContent('00:00');
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
    expect(screen.getByRole('button', { name: 'Claim' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Claim' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('restores background focus when the owner removes the offer', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open offer</button>{open && <HoldOfferModal countdown={10} onDecline={() => setOpen(false)} onConfirm={() => setOpen(false)} />}</>;
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open offer' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Decline' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});