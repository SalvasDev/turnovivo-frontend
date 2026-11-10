import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders the default person icon with an accessible label', () => {
    const { container } = render(<Avatar />);
    expect(screen.getByRole('img', { name: 'Avatar de usuario' })).toHaveAttribute('data-variant', 'default');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    ['Salvador Sanchez', 'SS'], ['  Ana   Maria Lopez  ', 'AL'], ['Ana', 'A'],
  ])('derives initials for %s', (name, initials) => {
    render(<Avatar variant="initials" name={name} />);
    expect(screen.getByRole('img', { name: name.trim().replace(/\s+/g, ' ') })).toHaveTextContent(initials);
  });

  it('falls back to the person icon when initials are unavailable', () => {
    const { container } = render(<Avatar variant="initials" name=" " />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a photo, falls back on error, and retries a changed source', () => {
    const { container, rerender } = render(<Avatar variant="photo" name="Ana Lopez" src="/avatar.jpg" />);
    expect(container.querySelector('img')?.src).toMatch(/\/avatar\.jpg$/);
    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByRole('img', { name: 'Ana Lopez' })).toHaveTextContent('AL');
    rerender(<Avatar variant="photo" name="Ana Lopez" src="/new-avatar.jpg" />);
    expect(container.querySelector('img')?.src).toMatch(/\/new-avatar\.jpg$/);
  });

  it('can be decorative inside a labelled trigger', () => {
    render(<Avatar decorative name="Ana Lopez" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});