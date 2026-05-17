"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Trend = "up" | "down" | "flat";

export interface StatCardProps {
    /** Short label, e.g. "Active students". */
    label: string;
    /** The headline figure. Pre-format ("73 %", "1,204"). */
    value: React.ReactNode;
    /** Lucide icon component (optional). Rendered at 16 px, monochrome. */
    icon?: React.ComponentType<{ className?: string }>;
    /**
     * Specific, factual delta line. Examples:
     *   "+12 this week"  ·  "−3 % vs. last month"  ·  "Steady at 91 %".
     * Avoid vague labels like "Recent" or "Assigned".
     */
    delta?: string;
    /** Visual treatment of the delta — informs color only. */
    trend?: Trend;
    /** Optional click target. When provided, the card becomes a button. */
    onClick?: () => void;
    /** Optional href; when provided, the card becomes a link surface. */
    href?: string;
    className?: string;
}

const trendClass: Record<Trend, string> = {
    up: "text-[var(--color-success)]",
    down: "text-[var(--color-danger)]",
    flat: "text-[var(--color-fg-subtle)]",
};

/**
 * StatCard — the canonical KPI surface. Replaces the bespoke inline-styled
 * stat cards in dashboards. Visual rules match Linear/Stripe:
 *  - Flat surface, hairline border, no tinted icon bubble.
 *  - Label uppercase 11 px / tabular value 30 px / delta 12 px.
 *  - Icon is monochrome and sits subtly in the top-right.
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    delta,
    trend = "flat",
    onClick,
    href,
    className,
}: StatCardProps) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-fg-subtle)]">
                    {label}
                </span>
                {Icon ? (
                    <Icon className="h-4 w-4 text-[var(--color-fg-subtle)]" />
                ) : null}
            </div>
            <div className="mt-3 font-display text-[length:var(--text-3xl)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-fg)]">
                {value}
            </div>
            {delta ? (
                <div className={cn("mt-1 text-xs", trendClass[trend])}>
                    {delta}
                </div>
            ) : null}
        </>
    );

    const shellClass = cn(
        "block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5",
        "shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-150",
        (onClick || href) && "cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        className,
    );

    if (href) {
        return (
            <a href={href} className={shellClass}>
                {content}
            </a>
        );
    }
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cn(shellClass, "text-left w-full")}>
                {content}
            </button>
        );
    }
    return <div className={shellClass}>{content}</div>;
}
