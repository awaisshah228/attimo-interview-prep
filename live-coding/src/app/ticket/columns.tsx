import { createColumnHelper } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { Ticket, TicketPriority, TicketStatus } from "./types"

const priorityColors: Record<TicketPriority, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
}

const statusColors: Record<TicketStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  "in-progress": "default",
  "in-review": "secondary",
  done: "default",
  closed: "secondary",
}

const columnHelper = createColumnHelper<Ticket>()

export const columns = [
  columnHelper.accessor("id", { header: "ID", size: 100 }),
  columnHelper.accessor("title", { header: "Title", size: 280 }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 120,
    cell: (info) => (
      <Badge variant={statusColors[info.getValue()]}>{info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor("priority", {
    header: "Priority",
    size: 100,
    cell: (info) => (
      <Badge variant={priorityColors[info.getValue()]}>{info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    size: 100,
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor("assignee", { header: "Assignee", size: 120 }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 140,
  }),
]
