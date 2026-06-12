import type { ReactNode } from 'react'

interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  emptyText?: string
}

const DataTable = <T,>({
  columns,
  data,
  getRowKey,
  emptyText = '표시할 데이터가 없습니다.',
}: DataTableProps<T>) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 ${column.className ?? ''} ${column.headerClassName ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-slate-700 ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-slate-400"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
