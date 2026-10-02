import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
export function DataTable<T>({
  data,
  columns,
  caption,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  caption: string;
}) {
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility: visibility },
    onColumnVisibilityChange: setVisibility,
    manualPagination: true,
  });
  return (
    <div>
      <details className="column-control">
        <summary>Columns</summary>
        <div className="column-options">
          {table
            .getAllLeafColumns()
            .filter((c) => c.getCanHide())
            .map((column) => (
              <label key={column.id}>
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {column.id}
              </label>
            ))}
        </div>
      </details>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th scope="col" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    <span className="mobile-label" aria-hidden="true">
                      {typeof cell.column.columnDef.header === 'string'
                        ? cell.column.columnDef.header
                        : cell.column.id}
                    </span>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  pending = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  pending?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {total} results · Page {page} of {pages}
      </span>
      <div className="actions">
        <button className="button secondary" disabled={page <= 1 || pending} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button
          className="button secondary"
          disabled={page >= pages || pending}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
