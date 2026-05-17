"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Input — TRILINK kit field.
 *
 *   - 7 px radius, hairline border, white surface
 *   - Focus: hairline-3 border + 3 px ink-tinted shadow (no iris ring; iris
 *     is reserved for the iconbtn focus ring)
 *   - Sizes match Button: sm = 26, md = 30 (default), lg = 36
 */
type FieldSize = "sm" | "md" | "lg";

const sizeClasses: Record<FieldSize, string> = {
    sm: "h-[26px] text-[12px] px-2.5",
    md: "h-[30px] text-[13px] px-[10px]",
    lg: "h-9 text-[13.5px] px-3",
};

const baseClasses =
    "flex w-full items-center rounded-[7px] bg-[var(--color-surface)] text-[var(--color-ink)] " +
    "border border-[var(--color-hairline)] " +
    "transition-[border-color,box-shadow] duration-150 " +
    "placeholder:text-[var(--color-ink-4)] " +
    "focus-visible:outline-none focus-visible:border-[var(--color-hairline-3)] " +
    "focus-visible:shadow-[var(--shadow-focus-ink)] " +
    "disabled:cursor-not-allowed disabled:opacity-50 " +
    "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:focus-visible:shadow-[0_0_0_3px_rgb(196_53_84_/_0.18)]";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    fieldSize?: FieldSize;
    leadingIcon?: React.ReactNode;
    trailingSlot?: React.ReactNode;
    invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { className, type = "text", fieldSize = "md", leadingIcon, trailingSlot, invalid, ...props },
        ref,
    ) => {
        if (!leadingIcon && !trailingSlot) {
            return (
                <input
                    ref={ref}
                    type={type}
                    aria-invalid={invalid || undefined}
                    className={cn(baseClasses, sizeClasses[fieldSize], className)}
                    {...props}
                />
            );
        }
        return (
            <div
                className={cn(
                    baseClasses,
                    sizeClasses[fieldSize],
                    "relative px-0 focus-within:border-[var(--color-hairline-3)] focus-within:shadow-[var(--shadow-focus-ink)]",
                    invalid && "border-[var(--color-danger)]",
                    className,
                )}
                aria-invalid={invalid || undefined}
            >
                {leadingIcon ? (
                    <span
                        aria-hidden
                        className="pointer-events-none flex h-full items-center pl-2.5 text-[var(--color-ink-3)] [&_svg]:size-[14px] [&_svg]:stroke-[1.5]"
                    >
                        {leadingIcon}
                    </span>
                ) : null}
                <input
                    ref={ref}
                    type={type}
                    className={cn(
                        "h-full w-full flex-1 bg-transparent outline-none",
                        leadingIcon ? "pl-2" : "pl-[10px]",
                        trailingSlot ? "pr-2" : "pr-[10px]",
                        "text-[length:inherit] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                    {...props}
                />
                {trailingSlot ? (
                    <span className="flex h-full items-center pr-1.5 text-[var(--color-ink-3)]">
                        {trailingSlot}
                    </span>
                ) : null}
            </div>
        );
    },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
    <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
            baseClasses,
            "min-h-[76px] py-[7px] px-[10px] leading-[1.5] text-[13px] h-auto resize-y",
            className,
        )}
        {...props}
    />
));
Textarea.displayName = "Textarea";
