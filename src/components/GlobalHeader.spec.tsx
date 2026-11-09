import { render, screen } from '@testing-library/react';
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

    await user.click(screen.getByRole('button', { name: 'Cerrar sesion' }));
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

  it('no renderiza el header en la pagina de login aunque exista sesion', () => {
    mockedUsePathname.mockReturnValue('/login');
    mockedUseAuth.mockReturnValue({
      loading: false,
      logout: vi.fn(),
      user: { email: 'admin.user@turnovivo.com', role: 'ADMIN' },
    });

    const { container } = render(<GlobalHeader />);
    expect(container).toBeEmptyDOMElement();
  });
});
