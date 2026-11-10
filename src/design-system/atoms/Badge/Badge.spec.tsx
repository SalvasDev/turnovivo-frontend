import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';
import { Icon } from '../Icon';
import type { BadgeAppearance, BadgeColor } from './Badge.types';

const colors: BadgeColor[] = ['success', 'error', 'warning', 'info'];
const appearances: BadgeAppearance[] = ['light', 'solid'];

describe('Badge', () => {
  it('defaults to the small, light success variant without an icon', () => {
    const { container } = render(<Badge>your turn</Badge>);
    const badge = screen.getByText('your turn').parentElement;
    expect(badge).toHaveAttribute('data-size', 'small');
    expect(badge).toHaveAttribute('data-color', 'success');
    expect(badge).toHaveAttribute('data-appearance', 'light');
    expect(container.querySelector('[aria-hidden]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  describe.each(appearances)('%s appearance', (appearance) => {
    it.each(colors)('renders the %s semantic state', (color) => {
      render(<Badge color={color} appearance={appearance}>{color}</Badge>);
      const badge = screen.getByText(color).parentElement;
      expect(badge).toHaveAttribute('data-color', color);
      expect(badge).toHaveAttribute('data-appearance', appearance);
    });

    it.each(colors)('supports a decorative icon in the %s state', (color) => {
      render(
        <Badge color={color} appearance={appearance} icon={<Icon name="check" aria-label="Check" />}>
          your turn
        </Badge>,
      );
      const badge = screen.getByText('your turn').parentElement;
      expect(badge?.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(badge).toHaveTextContent('your turn');
    });
  });

  it('forwards span attributes, custom classes and opt-in live status', () => {
    render(<Badge id="booking-state" className="custom-badge" role="status" aria-live="polite">Booked</Badge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('id', 'booking-state');
    expect(badge).toHaveAttribute('aria-live', 'polite');
    expect(badge).toHaveClass('custom-badge');
    expect(badge.className.trim().split(/\s+/)).toHaveLength(2);
    expect(badge).toHaveTextContent('Booked');
  });
});