import { NextRequest, NextResponse } from "next/server"
import { getTickets, addTicket } from "./data"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get("page") ?? "0", 10)
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10)
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const priority = searchParams.get("priority") ?? ""
  const type = searchParams.get("type") ?? ""
  const assignee = searchParams.get("assignee") ?? ""

  let filtered = getTickets()

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q)
    )
  }
  if (status) filtered = filtered.filter((t) => t.status === status)
  if (priority) filtered = filtered.filter((t) => t.priority === priority)
  if (type) filtered = filtered.filter((t) => t.type === type)
  if (assignee) filtered = filtered.filter((t) => t.assignee === assignee)

  const start = page * pageSize
  const data = filtered.slice(start, start + pageSize)

  return NextResponse.json({
    data,
    page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newTicket = addTicket({
    title: body.title,
    description: body.description ?? "",
    status: body.status ?? "open",
    priority: body.priority ?? "medium",
    type: body.type ?? "task",
    assignee: body.assignee ?? "Unassigned",
    reporter: body.reporter ?? "Alice",
    labels: body.labels ?? [],
  })

  return NextResponse.json(newTicket, { status: 201 })
}
