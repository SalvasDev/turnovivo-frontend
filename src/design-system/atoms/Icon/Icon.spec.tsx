import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('is hidden from assistive technology when decorative', () => {
    const { container } = render(<Icon name="add" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('becomes a named image when it carries meaning', () => {
    render(<Icon name="info" aria-label="Information" />);
    const img = screen.getByRole('img', { name: 'Information' });
    expect(img).not.toHaveAttribute('aria-hidden');
  });

  it('accepts custom dimensions and consumer classes', () => {
    const { container } = render(<Icon name="check" width={16} height={16} className="custom" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom');
    expect(svg).toHaveStyle({ width: '16px', height: '16px' });
  });
});
