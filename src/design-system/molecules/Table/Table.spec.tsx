import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table } from './Table';
import type { TableColumn } from './Table.types';

const columns: TableColumn<{ id: string; name: string }>[] = [
  { id: 'name', header: 'Name', isRowHeader: true, renderCell: item => item.name },
  { id: 'id', header: 'ID', renderCell: item => item.id },
];

describe('Table', () => {
  it('renders an accessible table with column and row headers', () => {
    render(<Table caption="Appointments" columns={columns} items={[{ id: 'slot-1', name: '09:00 a.m.' }]} getRowId={item => item.id} />);
    const table = screen.getByRole('table', { name: 'Appointments' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(table).getByRole('rowheader', { name: '09:00 a.m.' })).toHaveAttribute('scope', 'row');
    expect(within(table).getByRole('cell', { name: 'slot-1' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Appointments' })).toHaveAttribute('tabindex', '0');
  });

  it('renders a spanning empty state and preserves caller attributes', () => {
    render(<Table caption="Appointments" columns={columns} items={[]} getRowId={item => item.id} emptyMessage="No appointments" className="custom-table" aria-busy="true" />);
    expect(screen.getByRole('cell', { name: 'No appointments' })).toHaveAttribute('colspan', '2');
    expect(screen.getByRole('table')).toHaveClass('custom-table');
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });
});