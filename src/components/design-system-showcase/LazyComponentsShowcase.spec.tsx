import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LazyComponentsShowcase from './LazyComponentsShowcase';

vi.mock('./ComponentsShowcase', () => ({
  default: () => <section aria-label="Loaded components"><h2>Components</h2></section>,
}));

let trigger: (isIntersecting: boolean) => void = () => undefined;
const disconnect = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    trigger = (isIntersecting) => callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  observe() {}
  disconnect = disconnect;
}

describe('LazyComponentsShowcase', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('keeps the components code unloaded until the section nears the viewport', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    render(<LazyComponentsShowcase />);

    expect(screen.getByRole('heading', { name: 'Components' }).closest('section')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('region', { name: 'Loaded components' })).not.toBeInTheDocument();

    act(() => trigger(false));
    expect(screen.queryByRole('region', { name: 'Loaded components' })).not.toBeInTheDocument();

    act(() => trigger(true));
    expect(await screen.findByRole('region', { name: 'Loaded components' })).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });
});
