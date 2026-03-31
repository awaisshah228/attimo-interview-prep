"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/*
 * Production: next-themes + shadcn/ui
 *
 * - SSR-safe theme switching with no FOUC
 * - System preference detection
 * - Blocking script prevents flash of wrong theme
 * - shadcn Button, Card, Badge for design tokens
 */

export function ThemeToggleProduction() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? "☀️" : "🌙"}{" "}
        Switch to {resolvedTheme === "dark" ? "light" : "dark"}
      </Button>

      <div className="flex gap-2">
        {(["system", "light", "dark"] as const).map((t) => (
          <Button
            key={t}
            variant={theme === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(t)}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Current: <Badge variant="secondary">{theme}</Badge>{" "}
        Resolved: <Badge variant="outline">{resolvedTheme}</Badge>{" "}
        System: <Badge variant="outline">{systemTheme}</Badge>
      </p>
    </div>
  );
}

export function DemoCardProduction() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This card demonstrates next-themes + shadcn/ui. It supports system
          preference, persists to localStorage, prevents FOUC, and uses
          semantic design tokens that adapt automatically.
        </p>
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Secondary</Button>
        </div>
        <div className="flex gap-2">
          <Badge>Tag A</Badge>
          <Badge variant="secondary">Tag B</Badge>
          <Badge variant="outline">Tag C</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1">
        <p className="text-xs font-medium text-foreground">Libraries</p>
        <p className="text-xs text-muted-foreground">
          <strong>next-themes</strong> — SSR-safe, no FOUC, multi-theme &bull;{" "}
          <strong>shadcn/ui</strong> — Button, Card, Badge
        </p>
      </CardFooter>
    </Card>
  );
}
