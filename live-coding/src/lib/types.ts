// ── Autocomplete ──
export type Suggestion = {
  id: string;
  label: string;
};

// ── Todo ──
export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

// ── Feed / Posts ──
export type Post = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};

// ── Users (Data Table) ──
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
};

// ── Multi-Step Form ──
export type OnboardingData = {
  name: string;
  email: string;
  company: string;
  role: string;
  plan: "free" | "pro" | "enterprise";
};

// ── Photos (Modal routes) ──
export type Photo = {
  id: string;
  title: string;
  color: string;
};
