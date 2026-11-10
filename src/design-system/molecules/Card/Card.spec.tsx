import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card';
import { Icon } from '../../atoms/Icon';

describe('Card', () => {
  it('composes the badges, time and neutral outlined action from Figma', () => {
    render(
      <Card
        title="10:00 A.M."
        badges={[
          { children: 'Busy', color: 'error', appearance: 'light' },
          { children: 'Waiting', color: 'warning', appearance: 'solid' },
        ]}
        action={{ children: 'Leave waitlist' }}
      />,
    );
    expect(screen.getByRole('article', { name: '10:00 A.M.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '10:00 A.M.' })).toBeInTheDocument();
    expect(screen.getByText('Busy').parentElement).toHaveAttribute('data-color', 'error');
    expect(screen.getByText('Waiting').parentElement).toHaveAttribute('data-appearance', 'solid');
    const button = screen.getByRole('button', { name: 'Leave waitlist' });
    expect(button).toHaveAttribute('data-variant', 'outlined');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('executes the supplied action without containing reservation logic', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Card title="10:00 A.M." action={{ children: 'Leave waitlist', onPress }} />);
    await user.click(screen.getByRole('button', { name: 'Leave waitlist' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not execute a disabled action', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Card title="10:00 A.M." action={{ children: 'Unavailable', isDisabled: true, onPress }} />);
    const button = screen.getByRole('button', { name: 'Unavailable' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('marks a pending action as busy and blocks activation', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Card title="10:00 A.M." action={{ children: 'Leaving...', isPending: true, onPress }} />);
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
    await user.click(screen.getByRole('button', { name: 'Leaving...' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('supports a filled action, icons and dynamic Button class names', async () => {
    const user = userEvent.setup();
    render(
      <Card
        title="11:00 A.M."
        action={{
          variant: 'filled', children: 'Book', startIcon: <Icon name="add" />,
          className: ({ isHovered }) => isHovered ? 'custom-hover' : 'custom-rest',
        }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Book' });
    expect(button).toHaveAttribute('data-variant', 'filled');
    expect(button).toHaveClass('custom-rest');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await user.hover(button);
    expect(button).toHaveClass('custom-hover');
  });

  it('supports optional sections, caller styling and article attributes', () => {
    render(<Card title="10:00 A.M." id="slot-card" className="custom-card" aria-label="Appointment at ten" />);
    const card = screen.getByRole('article', { name: 'Appointment at ten' });
    expect(card).toHaveAttribute('id', 'slot-card');
    expect(card).toHaveClass('custom-card');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('10:00 A.M.');
  });
});