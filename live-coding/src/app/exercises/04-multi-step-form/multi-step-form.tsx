"use client";

import { useState } from "react";
import type { OnboardingData } from "@/lib/types";
import { ProgressBar } from "./progress-bar";
import { StepPersonal } from "./step-personal";
import { StepCompany } from "./step-company";
import { StepPlan } from "./step-plan";
import { StepReview } from "./step-review";

const INITIAL: OnboardingData = {
  name: "",
  email: "",
  company: "",
  role: "",
  plan: "free",
};

const TOTAL_STEPS = 4;

export function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingData, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const update = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fields).forEach((k) => delete next[k as keyof OnboardingData]);
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (step === 0) {
      if (!data.name.trim()) newErrors.name = "Name is required";
      if (!data.email.includes("@")) newErrors.email = "Valid email required";
    }
    if (step === 1) {
      if (!data.company.trim()) newErrors.company = "Company is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (validate()) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-800 bg-green-900/20 p-6 text-center">
        <p className="text-lg font-semibold text-green-400">
          Submitted successfully!
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Welcome, {data.name}. You chose the {data.plan} plan.
        </p>
        <button
          onClick={() => {
            setData(INITIAL);
            setStep(0);
            setSubmitted(false);
          }}
          className="mt-4 text-sm text-blue-400 hover:underline"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar steps={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <StepPersonal data={data} errors={errors} update={update} />
      )}
      {step === 1 && (
        <StepCompany data={data} errors={errors} update={update} />
      )}
      {step === 2 && <StepPlan data={data} update={update} />}
      {step === 3 && <StepReview data={data} />}

      <div className="flex justify-between pt-2">
        <button
          onClick={back}
          disabled={step === 0}
          className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 disabled:opacity-30"
        >
          Back
        </button>
        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={next}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
