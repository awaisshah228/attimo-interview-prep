// mergeProps: safely combines two prop objects. If both have onClick,
// it creates a new handler that calls BOTH. If both have className,
// it concatenates them. Without this, {...props} would overwrite.
import { mergeProps } from "@base-ui/react/merge-props"

// useRender: a factory hook that renders an element with:
// - A default tag (span, div, etc.)
// - A `render` prop to swap the tag (e.g., render as <a> instead of <span>)
// - A `state` object exposed via data-* attributes for CSS targeting
import { useRender } from "@base-ui/react/use-render"

// cva (class-variance-authority): creates a function that returns
// different class strings based on the "variant" prop.
// Think of it as a switch statement for Tailwind classes.
import { cva, type VariantProps } from "class-variance-authority"

// cn: merges class strings with clsx + tailwind-merge
// Handles conflicts: cn("p-4", "p-2") → "p-2" (last wins)
import { cn } from "@/lib/utils"

// ── Define all variant styles ──
// cva takes:
//   1st arg: base classes (always applied to every badge)
//   2nd arg: variant map (different styles per variant value)
const badgeVariants = cva(
  // Base classes — applied to ALL badges regardless of variant:
  // - inline-flex, centered, rounded pill shape
  // - 20px height, tiny text, medium weight
  // - focus ring styles, disabled styles
  // - SVG icon sizing
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      // Each key here is a variant value you can pass: <Badge variant="outline">
      variant: {
        // Solid primary background (dark bg, white text)
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        // Muted background
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        // Red-tinted for errors/warnings
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        // Just a border, no background fill
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        // No border, no background — appears on hover only
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        // Looks like a text link
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    // If no variant is passed, use "default"
    defaultVariants: {
      variant: "default",
    },
  }
)

// ── The Badge component ──
// Props breakdown:
// - className: extra classes from the consumer (merged with variant classes)
// - variant: which style to use ("default", "outline", "destructive", etc.)
// - render: optional — swap the underlying element (e.g., render={<a href="/">})
// - ...props: everything else (children, onClick, aria-*, etc.)
//
// Type: useRender.ComponentProps<"span"> gives us all valid <span> props
//       VariantProps<typeof badgeVariants> adds the `variant` prop type
function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  // useRender does the actual rendering:
  return useRender({
    // 1. Default element is <span> (inline, no semantic meaning)
    defaultTagName: "span",

    // 2. Merge our computed classes with the consumer's props
    //    mergeProps ensures event handlers don't overwrite each other
    props: mergeProps<"span">(
      {
        // cn() combines: variant classes + consumer's custom className
        // e.g., cn("bg-primary text-white", "ml-2") → "bg-primary text-white ml-2"
        className: cn(badgeVariants({ variant }), className),
      },
      props // consumer's onClick, children, aria-label, etc.
    ),

    // 3. If consumer passes render={<a href="/tag/react" />},
    //    the badge renders as an <a> tag instead of <span>
    //    All the same classes and props still apply
    render,

    // 4. State is exposed as data-* attributes on the DOM element:
    //    <span data-slot="badge" data-variant="outline">
    //    This lets you target badges in CSS: [data-slot=badge] { ... }
    state: {
      slot: "badge",
      variant,
    },
  })
}

// Export both the component and the variant function
// badgeVariants is exported so other components can reuse the same
// class logic without rendering a Badge (rare but useful)
export { Badge, badgeVariants }
