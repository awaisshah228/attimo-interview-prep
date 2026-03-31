"use client";

import type { OnboardingData } from "@/lib/types";

type Props = {
  data: OnboardingData;
  errors: Partial<Record<keyof OnboardingData, string>>;
  update: (fields: Partial<OnboardingData>) => void;
};

export function StepPersonal({ data, errors, update }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Personal Info</h2>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Name</label>
        <input
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email}</p>
        )}
      </div>
    </div>
  );
}
