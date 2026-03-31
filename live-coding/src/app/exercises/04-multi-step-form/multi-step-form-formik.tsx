"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
 * Formik + Yup + Framer Motion + shadcn/ui
 *
 * Key differences from react-hook-form version:
 * - Formik: one form instance across all steps (shared values object)
 * - RHF: separate form per step (each step validates independently)
 * - Formik uses validateOnChange + touched to show errors naturally
 * - Yup.reach() can validate specific fields for per-step validation
 *
 * When to pick Formik for multi-step:
 * - You want one form context shared across steps
 * - Team prefers declarative <Field> over register()
 * - You need Yup ecosystem (already used elsewhere)
 */

const fullSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Valid email required").required("Email is required"),
  company: Yup.string().required("Company is required"),
  role: Yup.string(),
  plan: Yup.string().oneOf(["free", "pro", "enterprise"]).required(),
});

// Per-step validation: only validate fields relevant to the current step
const stepSchemas = [
  Yup.object({ name: fullSchema.fields.name, email: fullSchema.fields.email }),
  Yup.object({ company: fullSchema.fields.company, role: fullSchema.fields.role }),
  Yup.object({ plan: fullSchema.fields.plan }),
  Yup.object({}), // review step — no validation
];

type FormValues = {
  name: string;
  email: string;
  company: string;
  role: string;
  plan: "free" | "pro" | "enterprise";
};

const INITIAL: FormValues = {
  name: "",
  email: "",
  company: "",
  role: "",
  plan: "free",
};

const PLANS = [
  { value: "free" as const, label: "Free", desc: "For personal projects" },
  { value: "pro" as const, label: "Pro", desc: "$20/mo — Professionals" },
  { value: "enterprise" as const, label: "Enterprise", desc: "Custom — Teams" },
];

const TOTAL_STEPS = 4;

function FormField({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Field name={name} as={Input} type={type} id={name} />
      <ErrorMessage
        name={name}
        component="p"
        className="text-sm text-destructive"
      />
    </div>
  );
}

export function MultiStepFormFormik() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const validateStep = async (values: FormValues): Promise<boolean> => {
    try {
      await stepSchemas[step].validate(values, { abortEarly: false });
      return true;
    } catch {
      return false;
    }
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
            <Button
              variant="link"
              className="mt-3"
              onClick={() => {
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
    <Formik
      initialValues={INITIAL}
      validationSchema={stepSchemas[step]}
      onSubmit={async (values, { setTouched }) => {
        const valid = await validateStep(values);
        if (!valid) return;

        if (step < TOTAL_STEPS - 1) {
          setStep((s) => s + 1);
          setTouched({});
        } else {
          setSubmitted(true);
        }
      }}
    >
      {({ values, setFieldValue, setTouched }) => (
        <Form className="space-y-6">
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
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-base font-medium">
                    Personal Info
                  </h2>
                  <FormField name="name" label="Name" />
                  <FormField name="email" label="Email" type="email" />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-base font-medium">
                    Company Info
                  </h2>
                  <FormField name="company" label="Company" />
                  <FormField name="role" label="Role (optional)" />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-base font-medium">
                    Choose Plan
                  </h2>
                  {PLANS.map((plan) => (
                    <label
                      key={plan.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                        values.plan === plan.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <input
                        type="radio"
                        name="plan"
                        checked={values.plan === plan.value}
                        onChange={() => setFieldValue("plan", plan.value)}
                        className="accent-primary"
                      />
                      <div>
                        <span className="font-medium">{plan.label}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {plan.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-base font-medium">
                    Review & Confirm
                  </h2>
                  <Card size="sm">
                    <CardContent className="divide-y">
                      {[
                        { label: "Name", value: values.name },
                        { label: "Email", value: values.email },
                        { label: "Company", value: values.company },
                        { label: "Role", value: values.role || "N/A" },
                        { label: "Plan", value: values.plan },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between py-2.5 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {row.label}
                          </span>
                          <span className="font-medium">{row.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => {
                setStep((s) => s - 1);
                setTouched({});
              }}
            >
              Back
            </Button>
            <Button type="submit">
              {step === TOTAL_STEPS - 1 ? "Submit" : "Next"}
            </Button>
          </div>

          <Card size="sm">
            <CardFooter className="flex-col items-start gap-1">
              <p className="text-xs font-medium text-foreground">Libraries</p>
              <p className="text-xs text-muted-foreground">
                <strong>Formik</strong> — one form context across all steps,
                declarative Field/ErrorMessage &bull; <strong>Yup</strong> —
                per-step schema validation &bull;{" "}
                <strong>Framer Motion</strong> — step transitions &bull;{" "}
                <strong>shadcn/ui</strong> — Input, Label, Button, Card
              </p>
            </CardFooter>
          </Card>
        </Form>
      )}
    </Formik>
  );
}
