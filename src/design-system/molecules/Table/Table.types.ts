import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface TableColumn<T> {
  id: string;
  header: ReactNode;
  renderCell: (item: T) => ReactNode;
  isRowHeader?: boolean;
  width?: string;
}

export interface TableProps<T> extends Omit<ComponentPropsWithoutRef<'table'>, 'children'> {
  caption: string;
  columns: readonly TableColumn<T>[];
  items: readonly T[];
  getRowId: (item: T) => string | number;
  emptyMessage?: ReactNode;
}