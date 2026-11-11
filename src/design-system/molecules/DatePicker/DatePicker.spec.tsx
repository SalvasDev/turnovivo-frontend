import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDate, parseDate } from '@internationalized/date';
import { I18nProvider } from 'react-aria-components';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';

function renderPicker(children: ReactNode) {
  return render(<I18nProvider locale="en-GB">{children}</I18nProvider>);
}

describe('DatePicker', () => {
  it('renders labelled date segments, required state and associated helper text', () => {
    renderPicker(<DatePicker isRequired helperText="Select an appointment date" />);
    const segments = screen.getAllByRole('spinbutton');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toHaveAccessibleName(/Appointment date/);
    expect(segments[0]).toHaveAccessibleDescription(/Select an appointment date/);
    expect(segments[0]).toHaveAttribute('aria-required', 'true');
    expect(screen.getByRole('button', { name: /^Choose date/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Clear: Appointment date' })).toBeDisabled();
  });

  it('opens the calendar and selects a date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<DatePicker defaultValue={parseDate('2026-11-13')} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /^Choose date/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /15 November 2026/ }));
    expect(onChange.mock.lastCall?.[0].toString()).toBe('2026-11-15');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('navigates months and restores focus after Escape', async () => {
    const user = userEvent.setup();
    renderPicker(<DatePicker defaultValue={parseDate('2026-11-13')} />);
    const trigger = screen.getByRole('button', { name: /^Choose date/ });
    await user.click(trigger);
    await user.click(screen.getAllByRole('button', { name: 'Next' }).find(button => button.getAttribute('slot') === 'next')!);
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Previous' }).find(button => button.getAttribute('slot') === 'previous')!);
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('moves between days with the arrow keys and exposes aria-selected and aria-disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(
      <DatePicker
        defaultValue={parseDate('2026-11-13')}
        minValue={parseDate('2026-11-10')}
        isDateUnavailable={(date) => date.day === 14}
        onChange={onChange}
      />,
    );
    screen.getByRole('button', { name: /^Choose date/ }).focus();
    await user.keyboard('{Enter}');

    const cell = (day: number) => screen.getByRole('button', { name: new RegExp(`\\b${day} November 2026`) });
    await waitFor(() => expect(cell(13)).toHaveFocus());
    expect(cell(13).closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(cell(14)).toHaveAttribute('aria-disabled', 'true');
    expect(cell(9)).toHaveAttribute('aria-disabled', 'true');

    await user.keyboard('{ArrowRight}');
    expect(cell(14)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(cell(21)).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(cell(20)).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onChange.mock.lastCall?.[0].toString()).toBe('2026-11-20');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('updates individual date segments from the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<DatePicker defaultValue={parseDate('2026-11-13')} onChange={onChange} />);
    await user.click(screen.getByRole('spinbutton', { name: /^day,/i }));
    await user.keyboard('{ArrowUp}');
    expect(onChange.mock.lastCall?.[0].toString()).toBe('2026-11-14');
  });

  it('clears an uncontrolled date without opening the calendar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<DatePicker defaultValue={parseDate('2026-11-13')} onChange={onChange} />);
    const clear = screen.getByRole('button', { name: 'Clear: Appointment date' });
    await user.click(clear);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(clear).toBeDisabled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')[0]).not.toHaveAttribute('aria-valuenow');
  });

  it('clears a controlled date through the React Aria change callback', async () => {
    const user = userEvent.setup();
    function ControlledPicker() {
      const [value, setValue] = useState<CalendarDate | null>(parseDate('2026-11-13'));
      return <DatePicker value={value} onChange={setValue} />;
    }
    renderPicker(<ControlledPicker />);
    const clear = screen.getByRole('button', { name: 'Clear: Appointment date' });
    await user.click(clear);
    expect(clear).toBeDisabled();
    expect(screen.getAllByRole('spinbutton')[0]).not.toHaveAttribute('aria-valuenow');
  });

  it.each(['disabled', 'readOnly'] as const)('prevents changes when %s', async (mode) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(
      <DatePicker
        defaultValue={parseDate('2026-11-13')}
        state={mode === 'disabled' ? 'disabled' : 'default'}
        isReadOnly={mode === 'readOnly'}
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: /^Choose date/ });
    const clear = screen.getByRole('button', { name: 'Clear: Appointment date' });
    expect(trigger).toBeDisabled();
    expect(clear).toBeDisabled();
    await user.click(trigger);
    await user.click(clear);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects date limits and unavailable days', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(
      <DatePicker
        defaultValue={parseDate('2026-11-13')}
        minValue={parseDate('2026-11-10')}
        maxValue={parseDate('2026-11-20')}
        isDateUnavailable={(date) => date.day === 14}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Choose date/ }));
    const before = screen.getByRole('button', { name: /\b9 November 2026/ });
    const after = screen.getByRole('button', { name: /21 November 2026/ });
    const unavailable = screen.getByRole('button', { name: /14 November 2026/ });
    expect(before).toHaveAttribute('aria-disabled', 'true');
    expect(after).toHaveAttribute('aria-disabled', 'true');
    expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    await user.click(unavailable);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('exposes an error state and validation message', () => {
    renderPicker(<DatePicker state="error" errorMessage="This date is unavailable" />);
    expect(screen.getByText('This date is unavailable')).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')[0]).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('spinbutton')[0]).toHaveAccessibleDescription(/This date is unavailable/);
  });

  it('forwards custom classes, supports hiding Clear and submits an ISO date', () => {
    const { container } = renderPicker(
      <form>
        <DatePicker
          name="appointment-date"
          defaultValue={parseDate('2026-11-13')}
          showClearButton={false}
          className={() => 'custom-picker'}
        />
      </form>,
    );
    expect(container.querySelector('.custom-picker')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Clear/ })).not.toBeInTheDocument();
    expect(new FormData(container.querySelector('form')!).get('appointment-date')).toBe('2026-11-13');
  });
});