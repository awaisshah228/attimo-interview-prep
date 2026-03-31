import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { MultiStepForm } from "./multi-step-form";
import { MultiStepFormProduction } from "./multi-step-form-production";
import { MultiStepFormFormik } from "./multi-step-form-formik";

export default function MultiStepFormPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">04 — Multi-Step Form</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Three versions: manual validation, RHF + Zod, and Formik + Yup. All
        with animated step transitions.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            { label: "From Scratch", content: <MultiStepForm /> },
            {
              label: "RHF + Zod",
              content: <MultiStepFormProduction />,
            },
            {
              label: "Formik + Yup",
              content: <MultiStepFormFormik />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: manual validate(), error/step state management",
          "RHF + Zod: separate form per step, uncontrolled inputs",
          "Formik + Yup: one shared form across steps, controlled inputs",
          "Formik approach: single <Formik> wraps all steps, per-step Yup schema",
          "RHF approach: separate useForm() per step, data merged on advance",
        ]}
      />
    </main>
  );
}
