import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import type { ButtonColor, ButtonSize, ButtonVariant } from './Button.types';

const variants: ButtonVariant[] = ['filled', 'outlined', 'text'];
const colors: ButtonColor[] = ['brand', 'red', 'green', 'gold', 'neutral'];
const sizes: ButtonSize[] = ['large', 'medium', 'small'];

describe('Button', () => {
  it('defaults to a large filled brand button', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', 'filled');
    expect(button).toHaveAttribute('data-color', 'brand');
    expect(button).toHaveAttribute('data-size', 'large');
  });

  it.each(variants.flatMap(variant => colors.map(color => [variant, color] as const)))(
    'renders the %s variant in %s',
    (variant, color) => {
      render(<Button variant={variant} color={color}>Action</Button>);
      const button = screen.getByRole('button', { name: 'Action' });
      expect(button).toHaveAttribute('data-variant', variant);
      expect(button).toHaveAttribute('data-color', color);
    },
  );

  it.each(sizes)('renders the %s size', (size) => {
    render(<Button size={size}>Sized</Button>);
    const button = screen.getByRole('button', { name: 'Sized' });
    expect(button).toHaveAttribute('data-size', size);
  });

  it('does not forward the color prop as a native HTML attribute', () => {
    render(<Button color="red">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).not.toHaveAttribute('color');
  });

  it('keeps decorative icons hidden and the consumer className', () => {
    render(<Button className="custom" startIcon={<svg />} endIcon={<svg />}>Next</Button>);
    const button = screen.getByRole('button', { name: 'Next' });
    expect(button).toHaveClass('custom');
    expect(button.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('does not call onPress when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button color="green" isDisabled onPress={onPress}>Confirm</Button>);
    const button = screen.getByRole('button', { name: 'Confirm' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('locks while an async action runs, even on rapid double clicks, and shows a spinner', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const onPress = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<Button onPress={onPress} pendingLabel="Saving">Save</Button>);
    const button = screen.getByRole('button', { name: /^Save/ });
    await user.dblClick(button);
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('progressbar', { name: 'Saving' })).toBeInTheDocument();
    await act(async () => { finish(); });
    await waitFor(() => expect(button).not.toHaveAttribute('data-pending'));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('unlocks after a rejected async action so the user can retry', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn(() => Promise.reject(new Error('Network')).catch(() => undefined));
    render(<Button onPress={onPress}>Retry</Button>);
    const button = screen.getByRole('button', { name: /^Retry/ });
    await user.click(button);
    await waitFor(() => expect(button).not.toHaveAttribute('data-pending'));
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('stays locked after a navigation press when lockOnPress is set', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button lockOnPress onPress={onPress}>Start demo</Button>);
    const button = screen.getByRole('button', { name: /^Start demo/ });
    await user.dblClick(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('data-pending', 'true');
  });

  it('keeps synchronous actions such as toggles repeatable', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Toggle</Button>);
    await user.dblClick(screen.getByRole('button', { name: 'Toggle' }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('renders a square icon-only button named by its aria-label', () => {
    render(<Button iconOnly aria-label="Close dialog" variant="text" size="small"><svg /></Button>);
    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toHaveAttribute('data-icon-only', 'true');
    expect(button).toHaveAttribute('data-size', 'small');
  });

  it('blocks presses while the consumer controls isPending', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button isPending onPress={onPress}>Booking</Button>);
    await user.click(screen.getByRole('button', { name: /^Booking/ }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });
});
