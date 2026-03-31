import type { User } from "@/lib/types";

const ROLE_COLORS: Record<User["role"], string> = {
  admin: "bg-red-500/20 text-red-400",
  editor: "bg-blue-500/20 text-blue-400",
  viewer: "bg-zinc-500/20 text-zinc-400",
};

export function UserRow({ user }: { user: User }) {
  return (
    <tr className="border-b border-zinc-800">
      <td className="p-3 text-sm text-zinc-200">{user.name}</td>
      <td className="p-3 text-sm text-zinc-400">{user.email}</td>
      <td className="p-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            ROLE_COLORS[user.role]
          }`}
        >
          {user.role}
        </span>
      </td>
    </tr>
  );
}
