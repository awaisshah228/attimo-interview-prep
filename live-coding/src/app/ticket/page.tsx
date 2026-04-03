"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef, useState } from "react"
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
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { useDebounce } from "@/hooks/use-debounce"

import type { Ticket, PaginatedResponse } from "./types"
import { STATUSES, PRIORITIES, TYPES, ASSIGNEES } from "./types"
import { fetchTickets, createTicket, updateTicket, deleteTicket } from "./api"
import { columns } from "./columns"
import { FilterSelect } from "./filter-select"
import { TicketFormDialog } from "./ticket-form-dialog"
import { toast } from "sonner"
import axios from "axios"

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.response?.data?.error ?? err.message
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred"
}

const PAGE_SIZE = 20


// Software User Management Portal 

// list of tickets (mock data)
// search input
// filter by status (open / pending / resolved)
// Build an Interactive UI. 
// Tags for Tickets and its filter
// Type of tickets filter

export default function TicketPage() {
  const queryClient = useQueryClient()

  // Filters
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [assigneeFilter, setAssigneeFilter] = useState("")

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)

  // Query
  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["tickets", page, debouncedSearch, statusFilter, priorityFilter, typeFilter, assigneeFilter],
    queryFn: ({ signal }) =>
      fetchTickets(
        {
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
          priority: priorityFilter,
          type: typeFilter,
          assignee: assigneeFilter,
        },
        signal
      ),
    placeholderData: keepPreviousData,
  })

  // Mutations with optimistic updates
  const createMutation = useMutation({
    mutationFn: createTicket,
    onMutate: async (newTicket) => {
      // Cancel outgoing queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tickets"] })

      // Snapshot current cache for rollback
      const previousData = queryClient.getQueriesData<PaginatedResponse>({ queryKey: ["tickets"] })

      // Optimistically add the ticket to the current query
      queryClient.setQueriesData<PaginatedResponse>(
        { queryKey: ["tickets"] },
        (old) => {
          if (!old) return old
          const optimisticTicket: Ticket = {
            id: `TICK-temp-${Date.now()}`,
            title: newTicket.title ?? "",
            description: newTicket.description ?? "",
            status: newTicket.status ?? "open",
            priority: newTicket.priority ?? "medium",
            type: newTicket.type ?? "task",
            assignee: newTicket.assignee ?? "Unassigned",
            reporter: "You",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            labels: [],
          }
          return {
            ...old,
            data: [optimisticTicket, ...old.data],
            total: old.total + 1,
          }
        }
      )

      setCreateOpen(false)
      return { previousData }
    },
    onError: (err, _newTicket, context) => {
      // Rollback to snapshot on failure
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      setCreateOpen(true)
      toast.error("Failed to create ticket", { description: getErrorMessage(err) })
    },
    onSuccess: () => {
      toast.success("Ticket created")
    },
    onSettled: () => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTicket,
    onMutate: async (updatedTicket) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] })

      const previousData = queryClient.getQueriesData<PaginatedResponse>({ queryKey: ["tickets"] })

      // Optimistically update the ticket in cache
      queryClient.setQueriesData<PaginatedResponse>(
        { queryKey: ["tickets"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === updatedTicket.id
                ? { ...t, ...updatedTicket, updatedAt: new Date().toISOString() }
                : t
            ),
          }
        }
      )

      setEditTicket(null)
      return { previousData }
    },
    onError: (err, variables, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      // Reopen the edit dialog with the original ticket data
      const original = context?.previousData
        .flatMap(([, data]) => data?.data ?? [])
        .find((t) => t.id === variables.id)
      if (original) setEditTicket(original)
      toast.error("Failed to update ticket", { description: getErrorMessage(err) })
    },
    onSuccess: () => {
      toast.success("Ticket updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] })

      const previousData = queryClient.getQueriesData<PaginatedResponse>({ queryKey: ["tickets"] })

      // Optimistically remove the ticket from cache
      queryClient.setQueriesData<PaginatedResponse>(
        { queryKey: ["tickets"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.filter((t) => t.id !== deletedId),
            total: old.total - 1,
          }
        }
      )

      return { previousData }
    },
    onError: (err, _deletedId, context) => {
      // Rollback — ticket reappears
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.error("Failed to delete ticket", { description: getErrorMessage(err) })
    },
    onSuccess: () => {
      toast.success("Ticket deleted")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  // Table
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(0)
  }

  function resetFilters() {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setTypeFilter("")
    setAssigneeFilter("")
    setPage(0)
  }

  // TODO: Remove — test trigger for error boundary
  const [shouldThrow, setShouldThrow] = useState(false)
  if (shouldThrow) {
    throw new Error("Test error: verifying error boundary works!")
  }

  const hasFilters = search || statusFilter || priorityFilter || typeFilter || assigneeFilter

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <div className="flex gap-2">
          {/* TODO: Remove — test button for error boundary */}
          <Button variant="destructive" size="sm" onClick={() => setShouldThrow(true)}>
            Test Error
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Create Ticket</DialogTrigger>
            <TicketFormDialog
              onSubmit={(values) => createMutation.mutate(values)}
              isLoading={createMutation.isPending}
            />
          </Dialog>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search tickets..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-xs"
        />

        <FilterSelect
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(0) }}
          placeholder="Status"
          options={STATUSES}
        />
        <FilterSelect
          value={priorityFilter}
          onValueChange={(v) => { setPriorityFilter(v); setPage(0) }}
          placeholder="Priority"
          options={PRIORITIES}
        />
        <FilterSelect
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v); setPage(0) }}
          placeholder="Type"
          options={TYPES}
        />
        <FilterSelect
          value={assigneeFilter}
          onValueChange={(v) => { setAssigneeFilter(v); setPage(0) }}
          placeholder="Assignee"
          options={ASSIGNEES}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}

        {isFetching && (
          <span className="text-sm text-muted-foreground ml-auto">Loading...</span>
        )}
      </div>

      {/* Table + Pagination wrapper */}
      <div className="flex flex-col rounded-md border overflow-hidden h-[calc(100vh-220px)] min-h-[300px]">
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading tickets...
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {virtualizer.getVirtualItems().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <p className="text-lg font-medium">No tickets found</p>
                      <p className="text-sm">
                        {hasFilters
                          ? "Try adjusting your filters or search query."
                          : "Create your first ticket to get started."}
                      </p>
                      {hasFilters && (
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualizer.getTotalSize() > 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}
                      />
                    </tr>
                  )}
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index]
                    const ticket = row.original
                    return (
                      <TableRow key={row.id} data-index={virtualRow.index}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                            {cell.column.id === "actions" ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditTicket(ticket)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(ticket.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </div>
                            ) : (
                              flexRender(cell.column.columnDef.cell, cell.getContext())
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

      {/* Pagination — sticky at bottom of table container */}
      <div className="flex items-center justify-between border-t bg-background px-4 py-2 shrink-0">
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {data?.totalPages ?? 1} &middot; {data?.total ?? 0} tickets
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

      {/* Edit Dialog */}
      <Dialog open={!!editTicket} onOpenChange={(open) => !open && setEditTicket(null)}>
        {editTicket && (
          <TicketFormDialog
            defaultValues={editTicket}
            onSubmit={(values) => updateMutation.mutate({ id: editTicket.id, ...values })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  )
}
