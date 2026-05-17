"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * ToggleSwitch — TRILINK kit toggle. 28×16 px, ink-fill when on.
 *
 *   Visual: rail rounded-full, ink-2 hairline base, 12 px white knob.
 *   On: ink fill, knob slides 12 px to the right.
 */
export interface ToggleSwitchProps {
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    disabled?: boolean;
    "aria-label"?: string;
    className?: string;
}

export const ToggleSwitch = React.forwardRef<HTMLButtonElement, ToggleSwitchProps>(
    ({ checked, onCheckedChange, disabled, className, ...props }, ref) => (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
                checked ? "bg-[var(--color-ink)]" : "bg-[var(--color-hairline-2)]",
                className,
            )}
            {...props}
        >
            <span
                aria-hidden
                className={cn(
                    "absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm transition-transform duration-150",
                    checked ? "translate-x-3" : "translate-x-0",
                )}
            />
        </button>
    ),
);
ToggleSwitch.displayName = "ToggleSwitch";
