import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('defaults to an animated, decorative text placeholder', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('[data-variant="text"]');

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveAttribute('data-animated', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('supports shapes, dimensions, styles and disabling animation', () => {
    render(<Skeleton data-testid="profile-placeholder" variant="circular" width={64} height={64} isAnimated={false} className="custom" />);
    const skeleton = screen.getByTestId('profile-placeholder');

    expect(skeleton).toHaveAttribute('data-variant', 'circular');
    expect(skeleton).not.toHaveAttribute('data-animated');
    expect(skeleton).toHaveClass('custom');
    expect(skeleton).toHaveStyle({ width: '64px', height: '64px' });
  });
});