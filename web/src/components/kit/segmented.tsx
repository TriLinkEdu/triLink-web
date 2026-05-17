"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * SegmentedControl — TRILINK kit segmented control.
 *
 *   - 7 px radius, hairline border, surface-2 track
 *   - Active option: white surface, font-weight 500, 1 px ambient shadow
 */
export interface SegmentedOption<V extends string> {
    value: V;
    label: React.ReactNode;
}

export interface SegmentedProps<V extends string> {
    value: V;
    onChange: (next: V) => void;
    options: ReadonlyArray<SegmentedOption<V>>;
    className?: string;
    "aria-label"?: string;
}

export function SegmentedControl<V extends string>({
    value,
    onChange,
    options,
    className,
    "aria-label": ariaLabel,
}: SegmentedProps<V>) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={cn(
                "inline-flex w-full rounded-[7px] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-0.5",
                className,
            )}
        >
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "flex-1 rounded-[5px] px-2.5 py-[5px] text-[12px] text-[var(--color-ink-2)] transition-colors",
                            "hover:text-[var(--color-ink)]",
                            active
                                ? "bg-[var(--color-surface)] font-medium text-[var(--color-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                                : "bg-transparent",
                        )}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
