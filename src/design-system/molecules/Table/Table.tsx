import type { TableProps } from './Table.types';
import styles from './Table.module.css';

export function Table<T>({
  caption,
  columns,
  items,
  getRowId,
  emptyMessage = 'No results available.',
  className,
  ...props
}: TableProps<T>) {
  return (
    <div className={styles.viewport} role="region" aria-label={caption} tabIndex={0}>
      <table {...props} className={[styles.table, className].filter(Boolean).join(' ')}>
        <caption className={styles.caption}>{caption}</caption>
        <colgroup>
          {columns.map(column => <col key={column.id} style={{ width: column.width }} />)}
        </colgroup>
        <thead>
          <tr>
            {columns.map(column => <th key={column.id} scope="col" className={styles.header}>{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={getRowId(item)} className={styles.row}>
              {columns.map(column => column.isRowHeader ? (
                <th key={column.id} scope="row" className={styles.cell}>{column.renderCell(item)}</th>
              ) : (
                <td key={column.id} className={styles.cell}>{column.renderCell(item)}</td>
              ))}
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className={styles.empty} colSpan={columns.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}