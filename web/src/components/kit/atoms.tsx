"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Atoms for the TRILINK kit:
 *   - KbdKey       compact keyboard hint
 *   - LiveChip     "Live · synced" green-dot meta strip
 *   - IconBtn      28×28 ghost button (kit's `.iconbtn`)
 *   - RoleLogo     square role-tinted brand mark (kit's sidebar/logo)
 *   - RoleDot      6 px role indicator dot for page meta
 *   - Crumb        breadcrumb strip "Section · Subsection"
 *   - HairlineDivider for in-card section breaks
 */

export const KbdKey = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    ({ className, ...props }, ref) => (
        <span
            ref={ref}
            className={cn(
                "rounded bg-[var(--color-surface-3)] px-1.5 py-[1px] text-[10.5px] font-medium tracking-[0.02em] text-[var(--color-ink-3)]",
                className,
            )}
            {...props}
        />
    ),
);
KbdKey.displayName = "KbdKey";

export type LiveChipIntent = "success" | "brand" | "warning";

const liveDot: Record<LiveChipIntent, string> = {
    success: "bg-[var(--color-success)]",
    brand: "bg-[var(--color-brand)]",
    warning: "bg-[var(--color-warning)]",
};

export interface LiveChipProps extends React.HTMLAttributes<HTMLSpanElement> {
    intent?: LiveChipIntent;
}

export const LiveChip = React.forwardRef<HTMLSpanElement, LiveChipProps>(
    ({ className, intent = "success", children = "Live · synced", ...props }, ref) => (
        <span
            ref={ref}
            className={cn(
                "inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-3)]",
                className,
            )}
            style={{ fontVariantNumeric: "tabular-nums" }}
            {...props}
        >
            <span aria-hidden className={cn("size-[5px] rounded-full", liveDot[intent])} />
            {children}
        </span>
    ),
);
LiveChip.displayName = "LiveChip";

export const IconBtn = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { withDot?: boolean }
>(({ className, withDot, children, ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        className={cn(
            "relative inline-flex size-7 items-center justify-center rounded-[7px] text-[var(--color-ink-2)] transition-colors",
            "hover:bg-[rgba(15,16,18,0.06)] hover:text-[var(--color-ink)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
            "[&_svg]:size-[15px] [&_svg]:stroke-[1.5]",
            className,
        )}
        {...props}
    >
        {children}
        {withDot ? (
            <span
                aria-hidden
                className="absolute right-[5px] top-[5px] size-[6px] rounded-full border-[1.5px] border-[var(--color-bg)] bg-[var(--color-danger)]"
            />
        ) : null}
    </button>
));
IconBtn.displayName = "IconBtn";

export type RoleId = "student" | "teacher" | "admin" | "parent";

const roleBg: Record<RoleId, string> = {
    student: "bg-[var(--color-role-student)]",
    teacher: "bg-[var(--color-role-teacher)]",
    admin: "bg-[var(--color-role-admin)]",
    parent: "bg-[var(--color-role-parent)]",
};

export interface RoleLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
    role?: RoleId;
    size?: 22 | 26 | 32 | 40 | 56;
    icon?: React.ReactNode;
}

export const RoleLogo = React.forwardRef<HTMLSpanElement, RoleLogoProps>(
    ({ role, size = 26, icon, className, ...props }, ref) => {
        const dim = `${size}px`;
        const radius = size <= 22 ? 6 : size <= 32 ? 7 : 12;
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex shrink-0 items-center justify-center text-white",
                    role ? roleBg[role] : "bg-[var(--color-ink)]",
                    className,
                )}
                style={{ width: dim, height: dim, borderRadius: radius }}
                {...props}
            >
                {icon}
            </span>
        );
    },
);
RoleLogo.displayName = "RoleLogo";

const roleDot: Record<RoleId, string> = {
    student: "bg-[var(--color-role-student)]",
    teacher: "bg-[var(--color-role-teacher)]",
    admin: "bg-[var(--color-role-admin)]",
    parent: "bg-[var(--color-role-parent)]",
};

export const RoleDot = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { role?: RoleId }
>(({ role = "student", className, ...props }, ref) => (
    <span
        ref={ref}
        aria-hidden
        className={cn("inline-block size-[6px] rounded-full", roleDot[role], className)}
        {...props}
    />
));
RoleDot.displayName = "RoleDot";

export interface CrumbProps extends React.HTMLAttributes<HTMLDivElement> {
    items: ReadonlyArray<React.ReactNode>;
}

/** Breadcrumb strip rendered above the page title (kit's `.header__crumb`). */
export const Crumb = React.forwardRef<HTMLDivElement, CrumbProps>(
    ({ items, className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex items-center gap-1.5 text-[12px] text-[var(--color-ink-3)]",
                className,
            )}
            {...props}
        >
            {items.map((it, i) => (
                <React.Fragment key={i}>
                    {i > 0 ? (
                        <span className="text-[var(--color-ink-4)]" aria-hidden>
                            /
                        </span>
                    ) : null}
                    <span>{it}</span>
                </React.Fragment>
            ))}
        </div>
    ),
);
Crumb.displayName = "Crumb";

export const HairlineDivider = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        role="separator"
        className={cn("h-px w-full bg-[var(--color-hairline)]", className)}
        {...props}
    />
));
HairlineDivider.displayName = "HairlineDivider";
