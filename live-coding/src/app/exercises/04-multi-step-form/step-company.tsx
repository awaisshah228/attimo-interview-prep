"use client";

import type { OnboardingData } from "@/lib/types";

type Props = {
  data: OnboardingData;
  errors: Partial<Record<keyof OnboardingData, string>>;
  update: (fields: Partial<OnboardingData>) => void;
};

export function StepCompany({ data, errors, update }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Company Info</h2>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Company</label>
        <input
          value={data.company}
          onChange={(e) => update({ company: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-500"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-400">{errors.company}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Role</label>
        <input
          value={data.role}
          onChange={(e) => update({ role: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
