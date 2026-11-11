import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConnectionNotice from './ConnectionNotice';

describe('ConnectionNotice', () => {
  it('keeps an empty live region without a visible offline panel', () => {
    const { container } = render(<ConnectionNotice isOffline={false} onRetry={async () => undefined} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(container.querySelector('[data-offline]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows a Retry action while offline and returns its request promise', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(async () => undefined);
    render(<ConnectionNotice isOffline onRetry={onRetry} />);

    expect(screen.getByRole('status')).toHaveTextContent('Connection lost.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});