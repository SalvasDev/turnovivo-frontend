import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalHeader from './GlobalHeader';
import { DEFAULT_DEMO_PATH } from '@/config/app';

const mockedUsePathname = vi.fn();
const mockedUseAuth = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockedUsePathname(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('GlobalHeader', () => {
  beforeEach(() => {
    mockedUsePathname.mockReset();
    mockedUseAuth.mockReset();
    delete document.documentElement.dataset.theme;
    localStorage.clear();
  });

  it('muestra menu admin y logout para usuario ADMIN', async () => {
    const logout = vi.fn();
    const user = userEvent.setup();

    mockedUsePathname.mockReturnValue(DEFAULT_DEMO_PATH);
    mockedUseAuth.mockReturnValue({
      loading: false,
      logout,
      user: { email: 'admin.user@turnovivo.com', role: 'ADMIN' },
    });

    render(<GlobalHeader />);

    await user.click(screen.getByRole('button', { name: /admin user/i }));

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('no renderiza el header cuando no hay usuario autenticado', () => {
    mockedUsePathname.mockReturnValue(DEFAULT_DEMO_PATH);
    mockedUseAuth.mockReturnValue({
      loading: false,
      logout: vi.fn(),
      user: null,
    });

    const { container } = render(<GlobalHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it('navega el menu con teclado y devuelve el foco al Avatar al cerrar', async () => {
    const user = userEvent.setup();
    mockedUsePathname.mockReturnValue(DEFAULT_DEMO_PATH);
    mockedUseAuth.mockReturnValue({
      loading: false, logout: vi.fn(),
      user: { email: 'admin.user@turnovivo.com', role: 'ADMIN' },
    });
    render(<GlobalHeader />);
    const trigger = screen.getByRole('button', { name: /user menu of admin user/i });
    expect(trigger.querySelector('[data-variant="default"]')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const adminItem = await screen.findByRole('menuitem', { name: 'Dashboard Admin' });
    await waitFor(() => expect(adminItem).toHaveFocus());
    expect(adminItem).toHaveAttribute('href', '/admin');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('muestra solo logout para un cliente y cierra al hacer clic fuera', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    mockedUsePathname.mockReturnValue('/');
    mockedUseAuth.mockReturnValue({
      loading: false, logout,
      user: { email: 'cliente@turnovivo.com', role: 'CLIENT' },
    });
    render(<GlobalHeader />);
    const trigger = screen.getByRole('button', { name: /user menu of cliente/i });
    await user.click(trigger);
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.queryByRole('menuitem', { name: 'Dashboard Admin' })).not.toBeInTheDocument();
    await user.click(document.body);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(logout).not.toHaveBeenCalled();
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('muestra la marca y permite cambiar el tema en el home sin sesion', async () => {
    const user = userEvent.setup();
    mockedUsePathname.mockReturnValue('/');
    mockedUseAuth.mockReturnValue({ loading: false, logout: vi.fn(), user: null });

    render(<GlobalHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TurnoVivo home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('turnovivo-theme')).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem('turnovivo-theme')).toBe('light');
  });

  it('reflects a theme applied before hydration by the init script', () => {
    document.documentElement.dataset.theme = 'dark';
    mockedUsePathname.mockReturnValue('/');
    mockedUseAuth.mockReturnValue({ loading: false, logout: vi.fn(), user: null });

    render(<GlobalHeader />);

    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});
