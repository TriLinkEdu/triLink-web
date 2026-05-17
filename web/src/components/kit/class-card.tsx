import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * ClassCard — TRILINK kit class/section card.
 *
 *   - 10 px radius, hairline border, 14 px padding
 *   - Hover lifts the border to `hairline-2` (no shadow, no transform)
 *   - Slots: title, sub (period · room · grade), meta row (key/value), trail
 */
export interface ClassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title: React.ReactNode;
    sub?: React.ReactNode;
    trail?: React.ReactNode;
    /** Meta row entries — rendered as "label: value", separated by hairline dot. */
    meta?: Array<{ label?: React.ReactNode; value: React.ReactNode }>;
}

export const ClassCard = React.forwardRef<HTMLDivElement, ClassCardProps>(
    ({ className, title, sub, trail, meta, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex cursor-pointer flex-col gap-2.5 rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-3.5 transition-colors",
                "hover:border-[var(--color-hairline-2)]",
                className,
            )}
            {...props}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium tracking-[-0.008em] text-[var(--color-ink)]">
                        {title}
                    </div>
                    {sub ? (
                        <div className="mt-0.5 text-[11.5px] text-[var(--color-ink-3)]">{sub}</div>
                    ) : null}
                </div>
                {trail}
            </div>

            {meta && meta.length > 0 ? (
                <div className="flex items-center gap-3 text-[11.5px] text-[var(--color-ink-2)]">
                    {meta.map((m, i) => (
                        <React.Fragment key={i}>
                            {i > 0 ? (
                                <span className="text-[var(--color-ink-4)]" aria-hidden>
                                    ·
                                </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                                {m.label ? (
                                    <span className="text-[var(--color-ink-3)]">{m.label}</span>
                                ) : null}
                                <b className="font-medium text-[var(--color-ink)]">{m.value}</b>
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            ) : null}

            {children}
        </div>
    ),
);
ClassCard.displayName = "ClassCard";
