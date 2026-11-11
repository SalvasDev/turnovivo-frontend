/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role --
   Safari drops table semantics once these elements leave `display: table` (stacked phone layout). */
import type { TableProps } from './Table.types';
import styles from './Table.module.css';

/**
 * On narrow screens rows stack as cards (see Table.module.css). Explicit ARIA roles keep the
 * table semantics that browsers drop once table elements stop using `display: table`.
 */
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
      <table {...props} role="table" className={[styles.table, className].filter(Boolean).join(' ')}>
        <caption className={styles.caption}>{caption}</caption>
        <colgroup>
          {columns.map(column => <col key={column.id} style={{ width: column.width }} />)}
        </colgroup>
        <thead role="rowgroup" className={styles.head}>
          <tr role="row">
            {columns.map(column => (
              <th key={column.id} scope="col" role="columnheader" className={styles.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className={styles.body}>
          {items.map(item => (
            <tr key={getRowId(item)} role="row" className={styles.row}>
              {columns.map(column => column.isRowHeader ? (
                <th key={column.id} scope="row" role="rowheader" className={styles.cell} data-row-header="">
                  {column.renderCell(item)}
                </th>
              ) : (
                <td
                  key={column.id}
                  role="cell"
                  className={styles.cell}
                  data-aside={typeof column.header === 'string' ? undefined : ''}
                >
                  {typeof column.header === 'string' && (
                    <span className={styles.cellLabel} aria-hidden="true">{column.header}</span>
                  )}
                  <span className={styles.cellValue}>{column.renderCell(item)}</span>
                </td>
              ))}
            </tr>
          ))}
          {items.length === 0 && (
            <tr role="row"><td role="cell" className={styles.empty} colSpan={columns.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}