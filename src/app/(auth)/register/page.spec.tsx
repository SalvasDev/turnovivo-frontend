import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiService } from '@/services/api';
import RegisterPage from './page';

vi.mock('@/services/api', () => ({ apiService: { registerCustomer: vi.fn() } }));

describe('RegisterPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => {
    if (vi.isFakeTimers()) vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the Figma form and associates the password requirements', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired();
    const password = screen.getByLabelText(/^Password/);
    expect(password).toBeRequired();
    expect(password).toHaveAttribute('minlength', '8');
    expect(password).toHaveAttribute('autocomplete', 'new-password');
    expect(password).toHaveAccessibleDescription('At least 8 characters, including one number');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it.each(['short1', 'password'])('does not send the invalid password %s', async (password) => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/), password);
    fireEvent.submit(screen.getByRole('form'));

    expect(apiService.registerCustomer).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters, including one number.');
  });

  it('blocks duplicate submissions and allows retry after an API error', async () => {
    let rejectRegistration!: (error: Error) => void;
    vi.mocked(apiService.registerCustomer).mockReturnValue(new Promise((_, reject) => {
      rejectRegistration = reject;
    }));
    const user = userEvent.setup();
    render(<RegisterPage />);
    const email = screen.getByRole('textbox', { name: 'Email' });
    const password = screen.getByLabelText(/^Password/);
    await user.type(email, 'test@example.com');
    await user.type(password, 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    const submit = screen.getByRole('button', { name: 'Creating account...' });
    expect(submit).toBeDisabled();
    expect(email).toHaveAttribute('readonly');
    await user.click(submit);
    expect(apiService.registerCustomer).toHaveBeenCalledTimes(1);
    expect(apiService.registerCustomer).toHaveBeenCalledWith('test@example.com', 'password123');

    await act(async () => { rejectRegistration(new Error('Email already registered')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Email already registered');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  it('announces success and disables the form until the existing login redirect', async () => {
    vi.mocked(apiService.registerCustomer).mockResolvedValue({
      id: 'test-user', email: 'test@example.com', role: 'CLIENT',
    });
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'password123');
    vi.useFakeTimers();
    await act(async () => { fireEvent.submit(screen.getByRole('form')); });

    expect(screen.getByRole('status')).toHaveTextContent('Account created successfully!');
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    expect(screen.getByLabelText(/^Password/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });
});