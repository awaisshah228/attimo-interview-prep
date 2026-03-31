import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { ThemeToggle } from "./theme-toggle";
import { DemoCard } from "./demo-card";
import {
  ThemeToggleProduction,
  DemoCardProduction,
} from "./theme-switcher-production";

export default function ThemeSwitcherPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">09 — Theme Switcher</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch uses manual localStorage + classList. Production uses next-themes
        with SSR-safe switching and FOUC prevention.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            {
              label: "From Scratch",
              content: (
                <div className="space-y-6">
                  <ThemeToggle />
                  <DemoCard />
                </div>
              ),
            },
            {
              label: "With next-themes",
              content: (
                <div className="space-y-6">
                  <ThemeToggleProduction />
                  <DemoCardProduction />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: manual localStorage, classList.toggle, mounted guard",
          "Production: next-themes — SSR-safe, system preference, no FOUC",
          "next-themes injects a blocking <script> to prevent flash",
          "Supports system + light + dark + custom themes out of the box",
        ]}
      />
    </main>
  );
}
