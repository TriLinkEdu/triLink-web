"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — TRILINK kit spec.
 *
 * Geometry:
 *   - default height 28 px (`sm`), large 32 px (`md`), xl 36 px (`lg`)
 *   - 7 px radius, 12.5–13 px text, weight 500, letter-spacing -0.005em
 *
 * Variants (kit names):
 *   - `primary`  ink-black fill (the canonical action color in the kit)
 *   - `secondary` white surface + hairline border
 *   - `ghost`    transparent, hairline on hover
 *   - `brand`    iris fill (used for role primary CTAs e.g. Student "Ask AI tutor")
 *   - `tonal`    iris-tinted-text on iris-tinted surface (AI accents)
 *   - `destructive` desaturated rose
 *
 * Focus: keyboard-only iris outline at 2 px. Loading replaces the label
 * with a centered spinner (Apple/Stripe pattern).
 */
const buttonVariants = cva(
    [
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px]",
        "font-medium select-none transition-[background-color,color,border-color,box-shadow,opacity] duration-100",
        "tracking-[-0.005em]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    ].join(" "),
    {
        variants: {
            variant: {
                /** Ink-black — the canonical "primary" color in the kit. */
                primary:
                    "bg-[var(--color-ink)] text-white hover:bg-[#1f1f22] [&_svg]:stroke-[1.8]",
                /** Legacy alias kept so existing call-sites that omit variant render correctly. */
                default:
                    "bg-[var(--color-ink)] text-white hover:bg-[#1f1f22] [&_svg]:stroke-[1.8]",
                /** White card on hairline border. */
                secondary:
                    "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-hairline)] hover:bg-[var(--color-surface-2)]",
                /** Ghost — hover reveals a faint ink-tinted surface. */
                ghost:
                    "bg-transparent text-[var(--color-ink-2)] hover:bg-[rgba(15,16,18,0.06)] hover:text-[var(--color-ink)]",
                /** Iris brand fill — used for role primary CTAs. */
                brand:
                    "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-ink)] [&_svg]:stroke-[1.8]",
                /** Tonal — iris-on-iris, restrained AI accent (e.g. "Ask AI tutor"). */
                tonal:
                    "bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)] border border-[rgba(91,91,214,0.18)] hover:bg-[#e4e4fd]",
                /** AI alias of tonal — kept distinct for semantic call-sites. */
                ai:
                    "bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)] border border-[rgba(91,91,214,0.18)] hover:bg-[#e4e4fd]",
                outline:
                    "border border-[var(--color-hairline)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]",
                destructive:
                    "bg-[var(--color-danger)] text-white hover:opacity-90",
                link:
                    "text-[var(--color-brand-ink)] underline-offset-4 hover:underline px-0 h-auto",
            },
            size: {
                /** xs — micro inline actions inside row hover-revealed toolbars */
                xs: "h-6 px-2 text-[11px] gap-1 [&_svg]:size-3",
                /** sm — DEFAULT. The kit's everywhere button. 28 px / 12.5 px text. */
                sm: "h-7 px-[11px] text-[12.5px] [&_svg]:size-[13px]",
                /** md — a touch larger for primary header CTAs (kit's `.btn-lg`). */
                md: "h-8 px-[13px] text-[13px] [&_svg]:size-[14px]",
                /** lg — marketing-style hero CTA only. */
                lg: "h-10 px-5 text-[13.5px] [&_svg]:size-4",
                /** icon — square 28 px icon button matches `.iconbtn`. */
                icon: "h-7 w-7 [&_svg]:size-[15px]",
                "icon-sm": "h-6 w-6 [&_svg]:size-[13px]",
                "icon-lg": "h-8 w-8 [&_svg]:size-4",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "sm",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            loading,
            disabled,
            leadingIcon,
            trailingIcon,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...props}
            >
                {loading ? (
                    <>
                        <span
                            aria-hidden
                            className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
                        />
                        <span className="sr-only">Loading</span>
                    </>
                ) : (
                    <>
                        {leadingIcon}
                        {children}
                        {trailingIcon}
                    </>
                )}
            </Comp>
        );
    },
);
Button.displayName = "Button";

export { buttonVariants };
