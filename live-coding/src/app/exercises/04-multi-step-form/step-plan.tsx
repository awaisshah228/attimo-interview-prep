"use client";

import type { OnboardingData } from "@/lib/types";

const PLANS: { value: OnboardingData["plan"]; label: string; desc: string }[] = [
  { value: "free", label: "Free", desc: "For personal projects" },
  { value: "pro", label: "Pro", desc: "$20/mo — For professionals" },
  { value: "enterprise", label: "Enterprise", desc: "Custom — For teams" },
];

type Props = {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
};

export function StepPlan({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Choose Plan</h2>
      {PLANS.map((plan) => (
        <label
          key={plan.value}
          className={`block cursor-pointer rounded-lg border p-4 transition-colors ${
            data.plan === plan.value
              ? "border-blue-500 bg-blue-500/10"
              : "border-zinc-700 hover:border-zinc-600"
          }`}
        >
          <input
            type="radio"
            name="plan"
            value={plan.value}
            checked={data.plan === plan.value}
            onChange={() => update({ plan: plan.value })}
            className="mr-3"
          />
          <span className="font-medium">{plan.label}</span>
          <span className="ml-2 text-sm text-zinc-400">{plan.desc}</span>
        </label>
      ))}
    </div>
  );
}
