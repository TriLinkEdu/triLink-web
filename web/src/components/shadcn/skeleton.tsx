"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "rect" | "circle" | "text";
    /** Width in px or any valid CSS length. */
    w?: number | string;
    /** Height in px or any valid CSS length. */
    h?: number | string;
}

/**
 * Skeleton — a single shimmer primitive. Uses a CSS-only animated gradient
 * (no JS) and respects `prefers-reduced-motion`.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = "rect", w, h, style, ...props }, ref) => {
        const radius =
            variant === "circle"
                ? "rounded-full"
                : variant === "text"
                    ? "rounded-sm"
                    : "rounded-md";
        const dims =
            variant === "text"
                ? "h-3"
                : variant === "circle"
                    ? "h-8 w-8"
                    : "h-4";
        return (
            <div
                ref={ref}
                aria-hidden
                className={cn(
                    "trilink-skeleton bg-[var(--color-muted)]",
                    radius,
                    dims,
                    className,
                )}
                style={{
                    width: w,
                    height: h,
                    ...style,
                }}
                {...props}
            />
        );
    },
);
Skeleton.displayName = "Skeleton";
