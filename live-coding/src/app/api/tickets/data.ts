import type { Ticket, TicketStatus, TicketPriority, TicketType } from "@/app/ticket/types"

const assignees = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah"]
const reporters = ["Alice", "Bob", "Charlie", "Diana"]
const labelPool = ["frontend", "backend", "api", "ui", "database", "auth", "performance", "docs"]
const statuses: TicketStatus[] = ["open", "in-progress", "in-review", "done", "closed"]
const priorities: TicketPriority[] = ["low", "medium", "high", "critical"]
const types: TicketType[] = ["bug", "feature", "task", "improvement"]

const ticketTitles = [
  "Fix login redirect loop",
  "Add dark mode toggle",
  "Optimize database queries",
  "Update user profile page",
  "Implement search autocomplete",
  "Fix broken pagination",
  "Add email notifications",
  "Refactor auth middleware",
  "Create onboarding flow",
  "Fix mobile responsive layout",
  "Add CSV export feature",
  "Update API documentation",
  "Fix memory leak in websocket",
  "Add rate limiting to API",
  "Implement SSO integration",
  "Fix date picker timezone bug",
  "Add drag and drop support",
  "Optimize image loading",
  "Fix duplicate form submission",
  "Add audit logging",
]

// In-memory store — persists across requests within the same server process
const tickets: Ticket[] = Array.from({ length: 20_000 }, (_, i) => {
  // Spread dates across ~2 years so timestamps look realistic
  const created = new Date(2024, 0, 1 + (i % 730))
  const updated = new Date(created.getTime() + Math.random() * 30 * 86400000)
  return {
    id: `TICK-${(i + 1).toString().padStart(5, "0")}`,
    title: ticketTitles[i % ticketTitles.length] + (i >= 20 ? ` (#${i + 1})` : ""),
    description: `Description for ticket ${i + 1}. This needs to be addressed.`,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    type: types[i % types.length],
    assignee: assignees[i % assignees.length],
    reporter: reporters[i % reporters.length],
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
    labels: [labelPool[i % labelPool.length], labelPool[(i + 3) % labelPool.length]],
  }
})

export function getTickets() {
  return tickets
}

export function getTicketById(id: string) {
  return tickets.find((t) => t.id === id)
}

export function addTicket(ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt">): Ticket {
  const newTicket: Ticket = {
    ...ticket,
    id: `TICK-${(tickets.length + 1).toString().padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  tickets.unshift(newTicket)
  return newTicket
}

export function updateTicketById(id: string, updates: Partial<Ticket>): Ticket | null {
  const index = tickets.findIndex((t) => t.id === id)
  if (index === -1) return null
  tickets[index] = {
    ...tickets[index],
    ...updates,
    id: tickets[index].id, // prevent id override
    updatedAt: new Date().toISOString(),
  }
  return tickets[index]
}

export function deleteTicketById(id: string): boolean {
  const index = tickets.findIndex((t) => t.id === id)
  if (index === -1) return false
  tickets.splice(index, 1)
  return true
}
