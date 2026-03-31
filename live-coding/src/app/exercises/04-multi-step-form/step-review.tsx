import type { OnboardingData } from "@/lib/types";

export function StepReview({ data }: { data: OnboardingData }) {
  const rows = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email },
    { label: "Company", value: data.company },
    { label: "Role", value: data.role || "N/A" },
    { label: "Plan", value: data.plan },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Review & Confirm</h2>
      <div className="rounded-lg border border-zinc-700 divide-y divide-zinc-800">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between px-4 py-3">
            <span className="text-sm text-zinc-400">{row.label}</span>
            <span className="text-sm font-medium text-zinc-200">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
