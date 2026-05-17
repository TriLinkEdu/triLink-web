import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Bar — TRILINK kit progress / utilization bar. 4 px tall, rounded-full.
 *
 *   The fill defaults to ink. Use the `intent` prop only when the bar is
 *   communicating state (brand for AI-driven progress, success/warning/danger
 *   for utilization or violation rates).
 */
export type BarIntent = "ink" | "brand" | "success" | "warning" | "danger";

const fillMap: Record<BarIntent, string> = {
    ink: "bg-[var(--color-ink)]",
    brand: "bg-[var(--color-brand)]",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    danger: "bg-[var(--color-danger)]",
};

export interface BarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** 0–100 */
    value: number;
    intent?: BarIntent;
    /** Visually hidden label for screen readers. */
    label?: string;
}

export const Bar = React.forwardRef<HTMLDivElement, BarProps>(
    ({ className, value, intent = "ink", label, ...props }, ref) => {
        const pct = Math.max(0, Math.min(100, value));
        return (
            <div
                ref={ref}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
                className={cn("h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]", className)}
                {...props}
            >
                <div
                    className={cn(
                        "h-full rounded-full transition-[width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                        fillMap[intent],
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        );
    },
);
Bar.displayName = "Bar";
