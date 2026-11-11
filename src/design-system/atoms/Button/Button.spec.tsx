import { render, screen } from '@testing-library/react';
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
});
