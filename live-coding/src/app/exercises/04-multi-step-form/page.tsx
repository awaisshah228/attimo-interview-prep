import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { MultiStepForm } from "./multi-step-form";
import { MultiStepFormProduction } from "./multi-step-form-production";

export default function MultiStepFormPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">04 — Multi-Step Form</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch uses manual validation + useState. Production uses react-hook-form
        + Zod schemas + Framer Motion transitions.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            { label: "From Scratch", content: <MultiStepForm /> },
            {
              label: "With RHF + Zod + Framer Motion",
              content: <MultiStepFormProduction />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: manual validate(), error state, step state",
          "Production: per-step useForm + zodResolver, AnimatePresence transitions",
          "react-hook-form — each step has its own form instance (no wasted re-renders)",
          "framer-motion — slide animation between steps with AnimatePresence",
        ]}
      />
    </main>
  );
}
