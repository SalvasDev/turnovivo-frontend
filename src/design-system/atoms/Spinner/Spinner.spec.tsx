import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is decorative by default so it does not duplicate a parent announcement', () => {
    const { container } = render(<Spinner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-size', 'medium');
  });

  it('announces a labelled status when used standalone', () => {
    render(<Spinner label="Loading appointments" size="large" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading appointments');
    expect(status).toHaveAttribute('data-size', 'large');
    expect(status).not.toHaveAttribute('aria-hidden');
  });

  it('keeps consumer attributes and class names', () => {
    const { container } = render(<Spinner id="spinner" className="custom" size="small" />);
    expect(container.firstElementChild).toHaveAttribute('id', 'spinner');
    expect(container.firstElementChild).toHaveClass('custom');
  });
});
