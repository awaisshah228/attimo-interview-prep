"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef, useState } from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"

// --- Types ---

type User = {
  id: number
  name: string
  email: string
  role: string
  status: string
}

type PaginatedResponse = {
  data: User[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// --- API call with axios + AbortSignal ---

async function fetchUsers(
  page: number,
  pageSize: number,
  search: string,
  signal?: AbortSignal
): Promise<PaginatedResponse> {
  const { data } = await axios.get<PaginatedResponse>("/api/users", {
    params: { page, pageSize, search },
    signal,
  })
  return data
}

// --- Columns ---

const columnHelper = createColumnHelper<User>()

const columns = [
  columnHelper.accessor("id", { header: "ID", size: 60 }),
  columnHelper.accessor("name", { header: "Name", size: 200 }),
  columnHelper.accessor("email", { header: "Email", size: 250 }),
  columnHelper.accessor("role", { header: "Role", size: 100 }),
  columnHelper.accessor("status", { header: "Status", size: 100 }),
]

const PAGE_SIZE = 50

// --- Component ---

export default function TableSearch() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const parentRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["users", page, debouncedSearch],
    queryFn: ({ signal }) => fetchUsers(page, PAGE_SIZE, debouncedSearch, signal),
    placeholderData: keepPreviousData,
  })

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(0)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        {isFetching && (
          <span className="text-sm text-muted-foreground">Searching...</span>
        )}
      </div>

      <div
        ref={parentRef}
        className="relative h-[600px] overflow-auto rounded-md border"
      >
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead key={i} style={{ width: col.size }}>
                    <Skeleton className="h-4 w-3/4" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} style={{ width: col.size }}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {virtualizer.getVirtualItems().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    No results.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualizer.getTotalSize() > 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{
                          height: virtualizer.getVirtualItems()[0]?.start ?? 0,
                        }}
                      />
                    </tr>
                  )}
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index]
                    return (
                      <TableRow key={row.id} data-index={virtualRow.index}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                  {virtualizer.getTotalSize() > 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{
                          height:
                            virtualizer.getTotalSize() -
                            (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                        }}
                      />
                    </tr>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {data?.totalPages ?? 1} &middot;{" "}
          {data?.total ?? 0} total users
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p: number) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p: number) => p + 1)}
            disabled={isPlaceholderData || page + 1 >= (data?.totalPages ?? 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
