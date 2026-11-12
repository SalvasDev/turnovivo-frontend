import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UIProvider } from '@/context/UIContext';
import ComponentsShowcase from './ComponentsShowcase';
import TokensShowcase from './TokensShowcase';

describe('Design system showcase', () => {
  it('lists every token group', () => {
    render(<TokensShowcase />);
    for (const name of ['Primitive colors', 'Semantic colors', 'Typography', 'Spacing', 'Radius', 'Elevation']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('list', { name: 'blue palette' })).toBeInTheDocument();
  });

  it('renders the component states and locks the async demo button while pending', async () => {
    const user = userEvent.setup();
    render(<UIProvider><ComponentsShowcase /></UIProvider>);

    expect(within(screen.getByRole('group', { name: 'Button variants by color' })).getAllByRole('button')).toHaveLength(18);
    expect(screen.getByRole('button', { name: /^Pending/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('table', { name: 'Empty state example' })).toHaveTextContent('No appointments available.');
    expect(within(screen.getByRole('table', { name: 'Example appointment slots' })).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Slot', 'Status', 'Client ID', 'Actions']);
    expect(screen.getByRole('button', { name: 'Actions for 9:00 – 9:30 AM' })).toHaveAttribute('data-icon-only', 'true');
    expect(screen.getByRole('button', { name: /Disabled select/ })).toBeDisabled();

    const asyncButton = screen.getByRole('button', { name: 'Async action (2s)' });
    await user.dblClick(asyncButton);
    expect(screen.getByRole('progressbar', { name: 'Processing' })).toBeInTheDocument();
  });

  it('opens the confirm dialog from its trigger', async () => {
    const user = userEvent.setup();
    render(<UIProvider><ComponentsShowcase /></UIProvider>);
    await user.click(screen.getByRole('button', { name: 'Open destructive' }));
    expect(screen.getByRole('alertdialog', { name: 'Delete company' })).toBeInTheDocument();
  });

  it('opens row actions from the icon-only table trigger', async () => {
    const user = userEvent.setup();
    render(<UIProvider><ComponentsShowcase /></UIProvider>);
    await user.click(screen.getByRole('button', { name: 'Actions for 9:00 – 9:30 AM' }));
    expect(screen.getByRole('menu', { name: 'Actions for 9:00 – 9:30 AM' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Cancel appointment' })).toBeInTheDocument();
  });
});
