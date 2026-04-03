import axios from "axios"
import type { Ticket, PaginatedResponse } from "./types"

export type TicketFilters = {
  page: number
  pageSize: number
  search: string
  status: string
  priority: string
  type: string
  assignee: string
}

export async function fetchTickets(
  params: TicketFilters,
  signal?: AbortSignal
): Promise<PaginatedResponse> {
  const { data } = await axios.get<PaginatedResponse>("/api/tickets", {
    params,
    signal,
  })
  return data
}

export async function createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
  const { data } = await axios.post<Ticket>("/api/tickets", ticket)
  return data
}

export async function updateTicket({
  id,
  ...updates
}: Partial<Ticket> & { id: string }): Promise<Ticket> {
  const { data } = await axios.patch<Ticket>(`/api/tickets/${id}`, updates)
  return data
}

export async function deleteTicket(id: string): Promise<void> {
  await axios.delete(`/api/tickets/${id}`)
}
