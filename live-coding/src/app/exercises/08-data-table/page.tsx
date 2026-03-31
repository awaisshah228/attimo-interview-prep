import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { getUsers } from "@/lib/data";
import { SearchFilter } from "./search-filter";
import { SortableHeader } from "./sortable-header";
import { UserRow } from "./user-row";
import { Pagination } from "./pagination";
import { DataTableProduction } from "./data-table-production";
import type { User } from "@/lib/types";

export default async function DataTablePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    dir?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sort = params.sort || "name";
  const dir = (params.dir || "asc") as "asc" | "desc";
  const search = params.search || "";

  const { users, total } = getUsers({ page, limit: 10, sort, dir, search });
  const allUsers = getUsers({ page: 1, limit: 100, sort: "name", dir: "asc", search: "" });
  const totalPages = Math.ceil(total / 10);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">08 — Data Table</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch uses URL-driven Server Component. Production uses @tanstack/react-table
        (headless, client-side sort/filter/paginate).
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            {
              label: "From Scratch (URL-driven)",
              content: (
                <div className="space-y-4">
                  <SearchFilter defaultValue={search} />
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full">
                      <thead className="border-b border-zinc-700 bg-zinc-900/50">
                        <tr>
                          <SortableHeader field="name" current={sort} dir={dir} label="Name" />
                          <SortableHeader field="email" current={sort} dir={dir} label="Email" />
                          <SortableHeader field="role" current={sort} dir={dir} label="Role" />
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <UserRow key={user.id} user={user} />
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-zinc-500">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination current={page} total={totalPages} />
                </div>
              ),
            },
            {
              label: "With TanStack Table",
              content: <DataTableProduction users={allUsers.users} />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: URL params → Server Component data fetch → Link-based pagination",
          "Production: @tanstack/react-table — headless, declarative column defs",
          "TanStack Table — built-in sorting, global filter, pagination row models",
          "Headless = you own the markup, library owns the logic",
        ]}
      />
    </main>
  );
}
