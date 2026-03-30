# TypeScript (Advanced)

## What It Is
TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It catches errors at compile time and provides better tooling (autocomplete, refactoring).

---

## Core Types

```tsx
// Primitives
let name: string = "Alice";
let age: number = 30;
let active: boolean = true;
let data: null = null;
let value: undefined = undefined;

// Arrays
let ids: number[] = [1, 2, 3];
let names: Array<string> = ["a", "b"];

// Tuples (fixed-length, typed arrays)
let pair: [string, number] = ["age", 30];

// Enums
enum Status { Active = "ACTIVE", Inactive = "INACTIVE" }

// Union types
let id: string | number = "abc";

// Literal types
let direction: "up" | "down" | "left" | "right" = "up";
```

---

## Advanced Types

### Generics
Create reusable components that work with any type.

```tsx
// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
first<number>([1, 2, 3]);  // number
first(["a", "b"]);          // string (inferred)

// Generic interface
interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### Conditional Types
Types that depend on a condition.

```tsx
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"

// Extract non-nullable
type NonNullable<T> = T extends null | undefined ? never : T;
type C = NonNullable<string | null>;  // string
```

### Mapped Types
Transform properties of an existing type.

```tsx
// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Make all properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};
```

### Template Literal Types

```tsx
type Color = "red" | "blue";
type Size = "sm" | "lg";
type Variant = `${Color}-${Size}`;  // "red-sm" | "red-lg" | "blue-sm" | "blue-lg"
```

### Discriminated Unions
Pattern for handling different shapes with a common tag.

```tsx
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
  }
}
```

---

## Built-in Utility Types

| Type | What It Does | Example |
|------|-------------|---------|
| `Partial<T>` | All properties optional | `Partial<User>` |
| `Required<T>` | All properties required | `Required<Config>` |
| `Pick<T, K>` | Select specific properties | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Remove specific properties | `Omit<User, 'password'>` |
| `Record<K, V>` | Object with keys K and values V | `Record<string, number>` |
| `Readonly<T>` | All properties readonly | `Readonly<Config>` |
| `ReturnType<T>` | Return type of a function | `ReturnType<typeof fetchUser>` |
| `Parameters<T>` | Parameter types of a function | `Parameters<typeof fn>` |
| `Awaited<T>` | Unwrap Promise type | `Awaited<Promise<string>>` → `string` |
| `Extract<T, U>` | Keep types assignable to U | `Extract<'a' \| 'b' \| 1, string>` → `'a' \| 'b'` |
| `Exclude<T, U>` | Remove types assignable to U | `Exclude<'a' \| 'b' \| 1, string>` → `1` |
| `NonNullable<T>` | Remove null/undefined | `NonNullable<string \| null>` → `string` |

---

## Strict Mode

Enable in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

This enables all strict checks:
- **`strictNullChecks`**: `null` and `undefined` are not assignable to other types
- **`noImplicitAny`**: must explicitly type when TS can't infer
- **`strictFunctionTypes`**: stricter function parameter checking
- **`strictPropertyInitialization`**: class properties must be initialized

---

## `satisfies` Keyword (TS 4.9+)

Validates a value matches a type **without widening** the type.

```tsx
type Config = Record<string, string | number>;

// Without satisfies — type is widened
const config: Config = { port: 3000, host: "localhost" };
config.port;  // string | number (lost the specific type)

// With satisfies — keeps narrow type
const config2 = { port: 3000, host: "localhost" } satisfies Config;
config2.port;  // number (preserved!)
```

## `as const`

Makes values deeply readonly and narrowly typed.

```tsx
const routes = {
  home: "/",
  blog: "/blog",
  about: "/about"
} as const;

type Route = typeof routes[keyof typeof routes];  // "/" | "/blog" | "/about"
```

---

## Common Interview Questions

1. **What's the difference between `interface` and `type`?**
   - Both define object shapes. `interface` supports declaration merging and `extends`. `type` supports unions, intersections, mapped types, and conditional types. Use `interface` for objects, `type` for everything else.

2. **What does `keyof` do?**
   - Returns a union of all property names: `keyof { a: 1, b: 2 }` → `"a" | "b"`

3. **What's the difference between `any` and `unknown`?**
   - `any`: disables type checking entirely
   - `unknown`: type-safe — must narrow before using

4. **What does `never` mean?**
   - A type that can never occur. Used for exhaustive checks and functions that never return.

5. **Explain `infer` keyword**
   - Used in conditional types to extract a type: `type Unpacked<T> = T extends Array<infer U> ? U : T;`
