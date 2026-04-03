import { NextRequest, NextResponse } from "next/server"

type User = {
  id: number
  name: string
  email: string
  role: string
  status: string
}

const allUsers: User[] = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ["Admin", "Editor", "Viewer"][i % 3],
  status: i % 5 === 0 ? "Inactive" : "Active",
}))

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get("page") ?? "0", 10)
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10)
  const search = searchParams.get("search") ?? ""

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300))

  const filtered = search
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.role.toLowerCase().includes(search.toLowerCase())
      )
    : allUsers

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
