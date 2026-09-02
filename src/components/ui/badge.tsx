import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // max-w-full so a long label wraps inside its container instead of widening it.
  "inline-flex items-center max-w-full gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
        outline:
          "border-border bg-card text-muted-foreground",
        success:
          "border-transparent bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
        warning:
          "border-transparent bg-[hsl(var(--warning)/0.14)] text-[hsl(38_92%_36%)] dark:text-[hsl(var(--warning))]",
        warm:
          "border-transparent bg-warm-soft text-[hsl(26_92%_40%)] dark:text-[hsl(var(--brand-warm))]",
        purple:
          "border-transparent bg-primary-soft text-primary",
        blue:
          "border-transparent bg-primary-soft text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
