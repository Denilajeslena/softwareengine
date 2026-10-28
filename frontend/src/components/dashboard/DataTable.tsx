import React from 'react';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/common/EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are currently no records matching this query or filter.',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="my-6"
      />
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-ivory-border bg-white shadow-scholarly', className)}>
      <table className="w-full text-left text-xs md:text-sm border-collapse">
        <thead className="bg-ivory-cream/80 border-b border-ivory-border">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={cn(
                  'px-4 py-3.5 font-serif font-bold text-forest-dark uppercase tracking-wider text-[11px]',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ivory-cream text-charcoal">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="hover:bg-ivory/50 transition-colors"
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={cn('px-4 py-3.5 align-middle', col.className)}
                >
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? String(item[col.accessorKey] ?? '')
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

