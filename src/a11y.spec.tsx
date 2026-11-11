import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/axe';
import { UIProvider } from '@/context/UIContext';
import ComponentsShowcase from '@/components/design-system-showcase/ComponentsShowcase';
import TokensShowcase from '@/components/design-system-showcase/TokensShowcase';
import AppointmentGrid from '@/components/appointment-grid/AppointmentGrid';
import AdminDashboardClient from '@/components/admin-dashboard-client/AdminDashboardClient';
import GlobalHeader from '@/components/global-header/GlobalHeader';
import LoginPage from '@/app/(auth)/login/page';
import RegisterPage from '@/app/(auth)/register/page';
import type { AppointmentSlot } from '@/types';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Fixtures are on 2026-11-13; a pinned clock keeps them upcoming.
vi.mock('@/hooks/useNow', () => ({
  useNow: () => Date.parse('2026-11-12T18:00:00Z'),
  readNow: () => Date.parse('2026-11-12T18:00:00Z'),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'admin.user@turnovivo.com', role: 'ADMIN' },
    token: 'token', loading: false, login: vi.fn(), logout: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  apiService: {
    getAvailableSlots: vi.fn(() => new Promise(() => {})),
    login: vi.fn(), registerCustomer: vi.fn(), bookAppointment: vi.fn(), cancelAppointment: vi.fn(),
  },
}));

const slots: AppointmentSlot[] = [
  {
    id: 'slot-1', businessId: 'b-1', staffId: 's-1', status: 'AVAILABLE',
    startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
    appointment: null, waitlistEntries: [], slotBlocks: [],
  },
  {
    id: 'slot-2', businessId: 'b-1', staffId: 's-1', status: 'RESERVED',
    startTime: '2026-11-13T11:00:00Z', endTime: '2026-11-13T11:30:00Z',
    appointment: { id: 'a-1', customerId: 'u-1' }, waitlistEntries: [], slotBlocks: [],
  },
];

describe('Accessibility (axe)', () => {
  it('design system tokens', async () => {
    const { container } = render(<TokensShowcase />);
    await expectNoA11yViolations(container);
  });

  it('design system components in every static state', async () => {
    const { container } = render(<UIProvider><ComponentsShowcase /></UIProvider>);
    await expectNoA11yViolations(container);
  });

  it('confirm dialog and form modal while open', async () => {
    const user = userEvent.setup();
    render(<UIProvider><ComponentsShowcase /></UIProvider>);
    await user.click(screen.getByRole('button', { name: 'Open destructive' }));
    await expectNoA11yViolations(document.body);
  });

  it('login and register pages', async () => {
    const login = render(<LoginPage />);
    await expectNoA11yViolations(login.container);
    login.unmount();
    const register = render(<RegisterPage />);
    await expectNoA11yViolations(register.container);
  });

  it('booking agenda, admin table and header', async () => {
    const { container } = render(
      <UIProvider>
        <GlobalHeader />
        <main>
          <AppointmentGrid initialSlots={slots} businessId="b-1" serverUserId="u-1" />
          <AdminDashboardClient initialSlots={slots} businessId="b-1" />
        </main>
      </UIProvider>,
    );
    await expectNoA11yViolations(container);
  });
});
