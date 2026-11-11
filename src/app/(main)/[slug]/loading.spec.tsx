import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from './loading';

describe('Business route loading state', () => {
  it('shows only rectangular date controls and simple slot placeholders', () => {
    const { container } = render(<Loading />);

    expect(screen.getByRole('region', { name: 'Loading appointment availability' })).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[class*="datePicker"] [data-variant="rectangular"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-variant="rectangular"]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-variant="circular"]')).toHaveLength(0);
    expect([...container.querySelectorAll('[data-variant]')].every((item) => item.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});