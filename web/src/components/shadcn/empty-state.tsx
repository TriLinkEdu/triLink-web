"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
    /** Optional Lucide icon component. Rendered at 28 px in a soft tinted square. */
    icon?: React.ComponentType<{ className?: string }>;
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Primary CTA. */
    action?: React.ReactNode;
    /** Optional secondary CTA / link. */
    secondaryAction?: React.ReactNode;
    /** Compact variant (used inside cards, tables). */
    compact?: boolean;
    className?: string;
}

/**
 * EmptyState — the canonical "nothing here yet" surface.
 *
 * Notion / Linear / Arc all share a near-identical pattern: a soft tinted
 * icon square, a confident title, a one-line description, and a single
 * primary action that *teaches the user what to do next*.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    compact,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center",
                compact ? "px-6 py-10" : "px-8 py-16",
                className,
            )}
        >
            {Icon ? (
                <div
                    aria-hidden
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-muted)] text-[var(--color-fg-muted)]"
                >
                    <Icon className="h-6 w-6" />
                </div>
            ) : null}
            <h3 className="font-display text-base font-semibold tracking-tight text-[var(--color-fg)]">
                {title}
            </h3>
            {description ? (
                <p className="mt-1.5 max-w-sm text-sm text-[var(--color-fg-muted)]">
                    {description}
                </p>
            ) : null}
            {(action || secondaryAction) ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {action}
                    {secondaryAction}
                </div>
            ) : null}
        </div>
    );
}
