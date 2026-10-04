import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--color-navy)] text-[var(--color-paper)]",
        secondary: "border-transparent bg-[var(--color-sand)] text-[var(--color-navy)]",
        outline: "border-[color-mix(in_oklab,var(--color-navy)_25%,transparent)] bg-transparent text-[var(--color-navy)]",
        accent: "border-transparent bg-[var(--color-coral)] text-white",
        muted: "border-transparent bg-[color-mix(in_oklab,var(--color-mute)_14%,transparent)] text-[var(--color-mute)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
