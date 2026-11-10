import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';
import { Icon } from '../Icon';

describe('Input', () => {
  it('associates the label, descriptions and required state with the input', () => {
    render(
      <Input label="Password" type="password" isRequired
        description="Account password" helperText="At least eight characters" />,
    );

    const input = screen.getByLabelText(/^Password/);
    expect(input).toHaveAccessibleName('Password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Account password At least eight characters');
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('supports typing, focus, controlled values and an input ref', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    const { rerender } = render(
      <Input label="Name" value="Alex" onChange={onChange} inputRef={inputRef} />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(inputRef.current).toBe(input);
    await user.click(input);
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('data-focused', 'true');
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalledWith('Alexa');
    rerender(<Input label="Name" value="Alexa" onChange={onChange} inputRef={inputRef} />);
    expect(input).toHaveValue('Alexa');
  });

  it('supports uncontrolled values and read-only fields', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Input label="Name" defaultValue="Alex" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await user.type(input, 'a');
    expect(input).toHaveValue('Alexa');
    rerender(<Input label="Name" isReadOnly />);
    await user.type(input, 'b');
    expect(input).toHaveValue('Alexa');
    expect(input).toHaveAttribute('readonly');
  });

  it('applies real disabled and invalid states', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Input label="Email" state="disabled" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    await user.type(screen.getByRole('textbox'), 'test');
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Input label="Email" state="error" errorMessage="Invalid email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Invalid email');
  });

  it('supports optional icons, help, links and an accessible name without a visible label', () => {
    const { container } = render(
      <Input aria-label="Search" startIcon={<Icon name="info" />}
        endIcon={<Icon name="check" />} labelHelp="Search by name"
        labelLink={{ href: '/help', children: 'Help' }} />,
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('img', { name: 'Search by name' })).toBeInTheDocument();
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(2);
  });

  it.each(['default', 'resting', 'active', 'success'] as const)('supports the %s state and dynamic className', (state) => {
    const { container } = render(<Input label="Name" state={state}
      className={({ isDisabled }) => isDisabled ? 'disabled' : 'custom'} />);
    expect(container.firstElementChild).toHaveAttribute('data-state', state);
    expect(container.firstElementChild).toHaveClass('custom');
    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
  });
});