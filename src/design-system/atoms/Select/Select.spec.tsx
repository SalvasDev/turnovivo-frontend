import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { id: 'admin-1', label: 'ana@company.com' },
  { id: 'admin-2', label: 'luis@company.com' },
];

describe('Select', () => {
  it('names the trigger with its label and shows the placeholder', () => {
    render(<Select label="Owner" placeholder="Select an admin" options={options} />);
    const trigger = screen.getByRole('button', { name: /Select an admin.*Owner/ });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector('.label svg')).not.toBeInTheDocument();
    expect(trigger.querySelector('span[class*="icon"] svg')).toBeInTheDocument();
  });

  it('selects an option with the pointer and reports the key', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Select label="Owner" placeholder="Select an admin" options={options} onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByRole('button', { name: /Owner/ }));
    await user.click(screen.getByRole('option', { name: 'luis@company.com' }));
    expect(onSelectionChange).toHaveBeenCalledWith('admin-2');
    expect(screen.getByRole('button', { name: /luis@company.com/ })).toBeInTheDocument();
  });

  it('supports keyboard selection and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Select label="Owner" placeholder="Select an admin" options={options} />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveTextContent('luis@company.com');
  });

  it('describes the field with helper text and hides the required marker from assistive technology', () => {
    render(<Select label="Owner" isRequired helperText="Only admins can own a company" options={options} />);
    expect(screen.getByText('(required)')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Only admins can own a company')).toBeInTheDocument();
  });

  it('cannot be opened while disabled', async () => {
    const user = userEvent.setup();
    render(<Select label="Owner" isDisabled options={options} />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
