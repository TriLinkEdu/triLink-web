import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[var(--color-primary-600)] text-white",
                secondary:
                    "border-transparent bg-[var(--color-muted)] text-[var(--color-fg)]",
                destructive:
                    "border-transparent bg-[var(--color-danger)] text-[var(--color-danger-fg)]",
                outline:
                    "border-[var(--color-border)] text-[var(--color-fg)]",
                success:
                    "border-transparent bg-[var(--color-success)] text-[var(--color-success-fg)]",
                warning:
                    "border-transparent bg-[var(--color-warning)] text-[var(--color-warning-fg)]",
            },
        },
        defaultVariants: { variant: "default" },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
