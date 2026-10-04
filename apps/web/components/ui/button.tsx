import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-bold transition-[transform,background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_10px_24px_-12px_rgb(6_22_41/0.55)] hover:-translate-y-0.5 hover:bg-[var(--color-navy-deep)] active:translate-y-0",
        accent: "bg-[var(--color-coral)] text-white shadow-[0_10px_24px_-12px_rgb(194_52_29/0.6)] hover:-translate-y-0.5 hover:bg-[var(--color-coral-deep)] active:translate-y-0",
        outline: "border-[1.5px] border-[color-mix(in_oklab,var(--color-navy)_35%,transparent)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]",
        secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-sand)]",
        ghost: "bg-transparent text-[var(--color-foreground)] hover:bg-[color-mix(in_oklab,var(--color-teal)_18%,transparent)]",
      },
      size: {
        default: "min-h-[3.25rem] px-7 py-3",
        sm: "min-h-[2.5rem] px-4 py-2 text-sm",
        lg: "min-h-[3.5rem] px-9 py-4 text-lg",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
