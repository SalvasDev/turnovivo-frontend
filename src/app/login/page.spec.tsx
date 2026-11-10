import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import LoginPage from './page';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/services/api', () => ({ apiService: { login: vi.fn() } }));

describe('LoginPage', () => {
  const login = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null, token: null, loading: false, login, logout: vi.fn(),
    });
  });

  afterEach(() => {
    if (vi.isFakeTimers()) vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the Figma form with required fields and navigation links', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired();
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/^Password/)).toBeRequired();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'TurnoVivo home' })).toHaveAttribute('href', '/');
  });

  it('blocks duplicate submissions and allows retry after an API error', async () => {
    let rejectLogin!: (error: Error) => void;
    vi.mocked(apiService.login).mockReturnValue(new Promise((_, reject) => { rejectLogin = reject; }));
    const user = userEvent.setup();
    render(<LoginPage />);

    const email = screen.getByRole('textbox', { name: 'Email' });
    const password = screen.getByLabelText(/^Password/);
    await user.type(email, 'test@example.com');
    await user.type(password, 'test-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const submit = screen.getByRole('button', { name: 'Signing in...' });
    expect(submit).toBeDisabled();
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    expect(email).toHaveAttribute('readonly');
    expect(password).toHaveAttribute('readonly');
    await user.click(submit);
    expect(apiService.login).toHaveBeenCalledTimes(1);
    expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'test-password');

    await act(async () => { rejectLogin(new Error('Invalid credentials')); });

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Invalid credentials');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(email).not.toHaveAttribute('readonly');
  });

  it('passes a successful access token to the existing auth context', async () => {
    const accessToken = `header.${btoa(JSON.stringify({ role: 'CLIENT' }))}.signature`;
    vi.mocked(apiService.login).mockResolvedValue({ accessToken });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'test-password');
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Sign in to your account' }));
    });

    expect(login).toHaveBeenCalledWith(accessToken);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});