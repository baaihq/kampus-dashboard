import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { EmptyState } from './ui';

export type SortDirection = 'asc' | 'desc';

export interface DataColumn<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null;
  className?: string;
  group?: string;
}

export interface DataGroup {
  label: ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  groups?: Record<string, DataGroup>;
  initialSort?: { key: string; dir: SortDirection };
  defaultDescKeys?: string[];
  zebra?: boolean;
  stickyHeader?: boolean;
  empty?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
  minWidth?: string;
  limit?: number;
  maxHeight?: string;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  groups,
  initialSort = { key: '', dir: 'asc' },
  defaultDescKeys = [],
  zebra = true,
  stickyHeader = true,
  empty,
  emptyTitle = 'Belum ada data',
  emptyDescription,
  footer,
  minWidth = '640px',
  limit,
  maxHeight,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(initialSort.key);
  const [sortDir, setSortDir] = useState<SortDirection>(initialSort.dir);

  const hasGroups = columns.some((c) => c.group);

  const sortedRows = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    const getValue = column.sortValue;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(defaultDescKeys.includes(key) ? 'desc' : 'asc');
    }
  };

  const alignClass = (align?: 'left' | 'right' | 'center') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  const renderHeaderCell = (column: DataColumn<T>, rowSpan?: number) => {
    const sortable = !!column.sortValue;
    return (
      <th
        key={column.key}
        rowSpan={rowSpan}
        className={`whitespace-nowrap px-2 py-2 ${alignClass(column.align)}`}
      >
        <button
          type="button"
          disabled={!sortable}
          onClick={() => toggleSort(column.key)}
          aria-label={`Urutkan ${typeof column.header === 'string' ? column.header : column.key}`}
          className={`inline-flex items-center gap-1 transition-colors ${
            sortable ? 'hover:text-primary' : 'cursor-default'
          }`}
        >
          {column.header}
          {sortable ? <SortIcon active={sortKey === column.key} dir={sortDir} /> : null}
        </button>
      </th>
    );
  };

  const renderHeader = () => {
    if (!hasGroups) {
      return (
        <tr className="border-b border-line dark:border-slate-700">
          {columns.map((column) => renderHeaderCell(column))}
        </tr>
      );
    }

    const segments: { column?: DataColumn<T>; group?: string; count: number }[] = [];
    let i = 0;
    while (i < columns.length) {
      const group = columns[i].group;
      if (group) {
        let count = 0;
        while (i + count < columns.length && columns[i + count].group === group) count += 1;
        segments.push({ group, count });
        i += count;
      } else {
        segments.push({ column: columns[i], count: 1 });
        i += 1;
      }
    }

    return (
      <>
        <tr className="border-b border-line dark:border-slate-700">
          {segments.map((segment, index) => {
            if (segment.column) return renderHeaderCell(segment.column, 2);
            const groupDef = groups?.[segment.group ?? ''];
            return (
              <th
                key={`group-${index}`}
                colSpan={segment.count}
                className={`whitespace-nowrap px-2 py-2 text-center ${groupDef?.className ?? ''}`}
              >
                {groupDef?.label ?? segment.group}
              </th>
            );
          })}
        </tr>
        <tr className="border-b border-line text-xs text-slate-400 dark:border-slate-700">
          {columns
            .filter((c) => c.group)
            .map((column) => renderHeaderCell(column))}
        </tr>
      </>
    );
  };

  const hasLeftBorder = (index: number) => {
    const group = columns[index]?.group;
    if (!group) return false;
    return index === 0 || columns[index - 1]?.group !== group;
  };

  const displayRows = limit ? sortedRows.slice(0, limit) : sortedRows;

  return (
    <div>
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead
            className={`bg-slate-50 text-xs uppercase tracking-wide text-muted dark:bg-slate-800 ${
              stickyHeader ? 'sticky top-0 z-10' : ''
            }`}
          >
            {renderHeader()}
          </thead>
          {displayRows.length > 0 ? (
            <tbody>
              {displayRows.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className={`border-b border-line transition-colors hover:bg-primary/5 dark:border-slate-800 dark:hover:bg-primary/10 ${
                    zebra && index % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-800/20' : ''
                  }`}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={`px-2.5 py-2.5 ${alignClass(column.align)} ${column.className ?? ''} ${
                        hasLeftBorder(index) ? 'border-l border-line dark:border-slate-800' : ''
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>
      </div>

      {sortedRows.length === 0 ? (
        empty ?? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )
      ) : (
        footer
      )}
    </div>
  );
}
