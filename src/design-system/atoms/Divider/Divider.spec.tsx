import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders a native separator and keeps consumer props', () => {
    render(<Divider id="section-divider" className="custom" />);
    const divider = screen.getByRole('separator');
    expect(divider.tagName).toBe('HR');
    expect(divider).toHaveAttribute('id', 'section-divider');
    expect(divider).toHaveClass('custom');
  });

  it('can be hidden from assistive technology when purely decorative', () => {
    render(<Divider aria-hidden="true" />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
