export type TicketPriority = "low" | "medium" | "high" | "critical"
export type TicketStatus = "open" | "in-progress" | "in-review" | "done" | "closed"
export type TicketType = "bug" | "feature" | "task" | "improvement"

export type Ticket = {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  assignee: string
  reporter: string
  createdAt: string
  updatedAt: string
  labels: string[]
}

export type PaginatedResponse = {
  data: Ticket[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const STATUSES: TicketStatus[] = ["open", "in-progress", "in-review", "done", "closed"]
export const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "critical"]
export const TYPES: TicketType[] = ["bug", "feature", "task", "improvement"]
export const ASSIGNEES = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah"]
