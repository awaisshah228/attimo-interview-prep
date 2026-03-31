"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
 * Production: react-hook-form + Zod + Framer Motion + shadcn/ui
 *
 * - Per-step form instances with per-step Zod schemas
 * - AnimatePresence for smooth step transitions
 * - shadcn Input/Label/Button/Card for design-system consistency
 */

const personalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
});

const companySchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().optional(),
});

const planSchema = z.object({
  plan: z.enum(["free", "pro", "enterprise"]),
});

type PersonalData = z.infer<typeof personalSchema>;
type CompanyData = z.infer<typeof companySchema>;
type PlanData = z.infer<typeof planSchema>;
type AllData = PersonalData & CompanyData & PlanData;

const PLANS = [
  { value: "free" as const, label: "Free", desc: "For personal projects" },
  { value: "pro" as const, label: "Pro", desc: "$20/mo — Professionals" },
  { value: "enterprise" as const, label: "Enterprise", desc: "Custom — Teams" },
];

const TOTAL_STEPS = 4;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function StepPersonal({
  onNext,
  defaults,
}: {
  onNext: (d: PersonalData) => void;
  defaults: PersonalData;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
    defaultValues: defaults,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="font-heading text-base font-medium">Personal Info</h2>
      <Field label="Name" error={errors.name?.message}>
        <Input {...register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" {...register("email")} />
      </Field>
      <div className="flex justify-end pt-2">
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

function StepCompany({
  onNext,
  onBack,
  defaults,
}: {
  onNext: (d: CompanyData) => void;
  onBack: () => void;
  defaults: CompanyData;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: defaults,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="font-heading text-base font-medium">Company Info</h2>
      <Field label="Company" error={errors.company?.message}>
        <Input {...register("company")} />
      </Field>
      <Field label="Role (optional)">
        <Input {...register("role")} />
      </Field>
      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

function StepPlan({
  onNext,
  onBack,
  defaults,
}: {
  onNext: (d: PlanData) => void;
  onBack: () => void;
  defaults: PlanData;
}) {
  const { handleSubmit, setValue, watch } = useForm<PlanData>({
    resolver: zodResolver(planSchema),
    defaultValues: defaults,
  });
  const selected = watch("plan");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="font-heading text-base font-medium">Choose Plan</h2>
      {PLANS.map((plan) => (
        <label
          key={plan.value}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
            selected === plan.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          )}
        >
          <input
            type="radio"
            name="plan"
            checked={selected === plan.value}
            onChange={() => setValue("plan", plan.value)}
            className="accent-primary"
          />
          <div>
            <span className="font-medium">{plan.label}</span>
            <span className="ml-2 text-sm text-muted-foreground">{plan.desc}</span>
          </div>
        </label>
      ))}
      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

export function MultiStepFormProduction() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AllData>({
    name: "", email: "", company: "", role: "", plan: "free",
  });
  const [submitted, setSubmitted] = useState(false);

  const advance = (partial: Partial<AllData>, nextStep: number) => {
    setData((prev) => ({ ...prev, ...partial }));
    setStep(nextStep);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-heading text-base font-medium">Submitted!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome, {data.name}. You chose the {data.plan} plan.
            </p>
            <Button
              variant="link"
              className="mt-3"
              onClick={() => {
                setData({ name: "", email: "", company: "", role: "", plan: "free" });
                setStep(0);
                setSubmitted(false);
              }}
            >
              Start over
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.15 }}
        >
          {step === 0 && <StepPersonal onNext={(d) => advance(d, 1)} defaults={data} />}
          {step === 1 && (
            <StepCompany onNext={(d) => advance(d, 2)} onBack={() => setStep(0)} defaults={data} />
          )}
          {step === 2 && (
            <StepPlan onNext={(d) => advance(d, 3)} onBack={() => setStep(1)} defaults={data} />
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-medium">Review & Confirm</h2>
              <Card size="sm">
                <CardContent className="divide-y">
                  {[
                    { label: "Name", value: data.name },
                    { label: "Email", value: data.email },
                    { label: "Company", value: data.company },
                    { label: "Role", value: data.role || "N/A" },
                    { label: "Plan", value: data.plan },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2.5 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setSubmitted(true)}>Submit</Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Card size="sm">
        <CardFooter className="flex-col items-start gap-1">
          <p className="text-xs font-medium text-foreground">Libraries</p>
          <p className="text-xs text-muted-foreground">
            <strong>react-hook-form</strong> — per-step form instances &bull;{" "}
            <strong>Zod</strong> — per-step schemas &bull;{" "}
            <strong>Framer Motion</strong> — AnimatePresence &bull;{" "}
            <strong>shadcn/ui</strong> — Input, Label, Button, Card
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
