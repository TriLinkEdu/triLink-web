"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Toolbar — a horizontal bar of related actions. Used for table headers,
 * editor controls, and page-level filter rows.
 *
 * Visual rules:
 *  - Flat surface (no card chrome) by default.
 *  - 8 px gap between groups, 4 px gap within a group.
 *  - Bottom hairline when stuck to a heading.
 */
export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    /** Adds a hairline border below for use under a `PageHeader`. */
    bordered?: boolean;
}

export function Toolbar({
    className,
    leading,
    trailing,
    bordered,
    children,
    ...props
}: ToolbarProps) {
    return (
        <div
            className={cn(
                "flex flex-wrap items-center justify-between gap-3 py-2",
                bordered && "border-b border-[var(--color-border)] pb-3",
                className,
            )}
            {...props}
        >
            <div className="flex items-center gap-2">{leading ?? children}</div>
            {(leading && children) ? (
                <div className="flex items-center gap-2">{children}</div>
            ) : null}
            {trailing ? (
                <div className="flex items-center gap-2">{trailing}</div>
            ) : null}
        </div>
    );
}

/** Visual divider between toolbar groups. */
export function ToolbarSeparator({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn("h-5 w-px bg-[var(--color-border)] mx-1", className)}
        />
    );
}
