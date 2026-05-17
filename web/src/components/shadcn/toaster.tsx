"use client";

import { Toaster as SonnerToaster, toast } from "sonner";
import { useTheme } from "next-themes";

/**
 * Toaster — Sonner-backed notification stack mounted once at the app root.
 *
 * Visual rules:
 *  - Top-right anchor (Linear / Vercel / Stripe convention).
 *  - Max 3 stacked, hairline border, no full-color background.
 *  - Left-edge accent bar per intent (success / warning / error / info).
 *
 * Usage:
 *   import { toast } from "@/components/shadcn/toaster";
 *   toast.success("Saved", { description: "Your changes are live." });
 */
export function Toaster() {
    const { resolvedTheme } = useTheme();
    return (
        <SonnerToaster
            theme={(resolvedTheme as "light" | "dark") ?? "light"}
            position="top-right"
            visibleToasts={3}
            closeButton
            richColors={false}
            duration={4500}
            toastOptions={{
                classNames: {
                    toast:
                        "group flex w-full items-start gap-3 rounded-lg border border-[var(--color-border)] " +
                        "bg-[var(--color-bg-elev)] p-3.5 pr-4 shadow-[var(--shadow-md)] " +
                        "text-[var(--color-fg)]",
                    title: "text-sm font-medium leading-5",
                    description: "text-xs text-[var(--color-fg-muted)] mt-0.5 leading-5",
                    actionButton:
                        "rounded-md bg-[var(--color-primary-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-700)]",
                    cancelButton:
                        "rounded-md bg-[var(--color-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-fg)]",
                    closeButton:
                        "!bg-[var(--color-muted)] !border-[var(--color-border)] !text-[var(--color-fg-muted)] hover:!bg-[var(--color-border)]",
                    success: "before:bg-[var(--color-success)]",
                    error: "before:bg-[var(--color-danger)]",
                    warning: "before:bg-[var(--color-warning)]",
                    info: "before:bg-[var(--color-info)]",
                },
                style: {
                    // Left-edge accent bar applied via `::before`.
                    paddingLeft: "1rem",
                } as React.CSSProperties,
            }}
        />
    );
}

export { toast };
