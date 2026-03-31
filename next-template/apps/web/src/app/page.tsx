import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Next Template</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Turborepo + Next.js 16 + shadcn/ui + Storybook
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            This template includes a monorepo with shared UI components.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Type something..." />
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Components from <code className="font-mono">@repo/ui</code>
          </p>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div className="rounded-lg border p-4">
          <p className="font-medium text-foreground">Monorepo</p>
          <p className="mt-1">Turborepo with Yarn workspaces</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="font-medium text-foreground">Components</p>
          <p className="mt-1">shadcn/ui in @repo/ui</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="font-medium text-foreground">Styling</p>
          <p className="mt-1">Tailwind 4 + CSS variables</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="font-medium text-foreground">Quality</p>
          <p className="mt-1">ESLint 9 + Prettier + TypeScript strict</p>
        </div>
      </div>
    </main>
  );
}
