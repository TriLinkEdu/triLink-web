"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title: React.ReactNode;
    /** Optional muted subtitle below the title. Keep this terse (≤ 12 words). */
    description?: React.ReactNode;
    /** Optional eyebrow line above the title. Use sparingly (only on dashboards). */
    eyebrow?: React.ReactNode;
    /** Right-aligned actions (Buttons, etc.). */
    actions?: React.ReactNode;
    /** Optional breadcrumb-like trail above the title. */
    trail?: React.ReactNode;
    /** Drop the bottom hairline divider. */
    bare?: boolean;
}

/**
 * PageHeader — the canonical title block for every page.
 *
 * Rules:
 *  - Title sets `--text-3xl` and `letter-spacing: -0.025em` to feel like
 *    Linear/Notion/Stripe headings.
 *  - Description stays under one line whenever possible — never marketing
 *    copy.
 *  - Eyebrow exists for the rare hero (e.g. role workspace) and is not
 *    decorated with sparkle icons.
 */
export function PageHeader({
    className,
    title,
    description,
    eyebrow,
    actions,
    trail,
    bare,
    ...props
}: PageHeaderProps) {
    return (
        <header
            className={cn(
                "flex flex-col gap-3 pb-6",
                !bare && "border-b border-[var(--color-border)] mb-8",
                className,
            )}
            {...props}
        >
            {trail ? (
                <div className="text-xs text-[var(--color-fg-subtle)]">{trail}</div>
            ) : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                    {eyebrow ? (
                        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-fg-subtle)]">
                            {eyebrow}
                        </div>
                    ) : null}
                    <h1 className="font-display text-[length:var(--text-3xl)] font-semibold tracking-[-0.025em] text-[var(--color-fg)]">
                        {title}
                    </h1>
                    {description ? (
                        <p className="text-sm text-[var(--color-fg-muted)] max-w-2xl">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex shrink-0 items-center gap-2">{actions}</div>
                ) : null}
            </div>
        </header>
    );
}
