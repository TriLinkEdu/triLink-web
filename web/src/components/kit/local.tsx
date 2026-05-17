"use client";
/**
 * Shared "local kit" helpers — small primitives that previously lived
 * inline in each admin page. Promoting them here so every page renders
 * the same dialog, toast, empty state, and field row, with one source
 * of truth for the TRILINK look.
 */
import React from "react";
import { Icon } from "@/components/kit/icon";

/* ─── KField — label + child input row ────────────────────────────── */
export function KField({
    label,
    children,
    hint,
    error,
    required,
}: {
    label: string;
    children: React.ReactNode;
    hint?: React.ReactNode;
    error?: string;
    required?: boolean;
}) {
    return (
        <div className="k-field">
            <span className="k-field__label">
                {label}
                {required ? (
                    <span style={{ color: "var(--color-danger)", marginLeft: 3 }} aria-hidden>
                        *
                    </span>
                ) : null}
            </span>
            {children}
            {error ? (
                <div style={{ fontSize: 11.5, color: "var(--color-danger)", marginTop: 4 }}>
                    {error}
                </div>
            ) : hint ? (
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>{hint}</div>
            ) : null}
        </div>
    );
}

/* ─── KitInput / KitTextarea / KitSelect — kit-styled controls ─── */
const inputBase: React.CSSProperties = {
    width: "100%",
    height: 32,
    padding: "0 10px",
    fontSize: 13,
    color: "var(--ink)",
    background: "var(--color-surface)",
    border: "1px solid var(--color-hairline)",
    borderRadius: 7,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 120ms ease",
};

export const KitInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function KitInput({ invalid, style, ...rest }, ref) {
    return (
        <input
            ref={ref}
            {...rest}
            style={{
                ...inputBase,
                ...(invalid ? { borderColor: "rgba(196,53,84,0.42)" } : null),
                ...style,
            }}
            onFocus={(e) => {
                if (!invalid) e.currentTarget.style.borderColor = "var(--ink)";
                rest.onFocus?.(e);
            }}
            onBlur={(e) => {
                if (!invalid) e.currentTarget.style.borderColor = "var(--color-hairline)";
                rest.onBlur?.(e);
            }}
        />
    );
});

export const KitSelect = React.forwardRef<
    HTMLSelectElement,
    React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function KitSelect({ invalid, style, children, ...rest }, ref) {
    return (
        <select
            ref={ref}
            {...rest}
            style={{
                ...inputBase,
                paddingRight: 24,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                background:
                    "var(--color-surface) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2398989a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\") no-repeat right 10px center",
                cursor: "pointer",
                ...(invalid ? { borderColor: "rgba(196,53,84,0.42)" } : null),
                ...style,
            }}
            onFocus={(e) => {
                if (!invalid) e.currentTarget.style.borderColor = "var(--ink)";
                rest.onFocus?.(e);
            }}
            onBlur={(e) => {
                if (!invalid) e.currentTarget.style.borderColor = "var(--color-hairline)";
                rest.onBlur?.(e);
            }}
        >
            {children}
        </select>
    );
});

export const KitTextarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function KitTextarea({ invalid, style, ...rest }, ref) {
    return (
        <textarea
            ref={ref}
            {...rest}
            style={{
                ...inputBase,
                height: "auto",
                minHeight: 80,
                padding: "8px 10px",
                lineHeight: 1.45,
                resize: "vertical",
                ...(invalid ? { borderColor: "rgba(196,53,84,0.42)" } : null),
                ...style,
            }}
            onFocus={(e) => {
                if (!invalid) e.currentTarget.style.borderColor = "var(--ink)";
                rest.onFocus?.(e);
            }}
            onBlur={(e) => {
                if (!invalid) e.currentTarget.style.borderColor = "var(--color-hairline)";
                rest.onBlur?.(e);
            }}
        />
    );
});

/* ─── KitEmpty — flat dashed empty-state ──────────────────────────── */
export function KitEmpty({
    title,
    sub,
    icon,
    action,
}: {
    title: string;
    sub?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div
            style={{
                padding: "32px 20px",
                textAlign: "center",
                border: "1px dashed var(--color-hairline)",
                borderRadius: 10,
                background: "var(--color-surface-2)",
            }}
        >
            {icon ? (
                <div
                    style={{
                        width: 36,
                        height: 36,
                        margin: "0 auto 10px",
                        borderRadius: 8,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-hairline)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ink-2)",
                    }}
                >
                    {icon}
                </div>
            ) : null}
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 3,
                    letterSpacing: "-0.01em",
                }}
            >
                {title}
            </div>
            {sub ? (
                <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>{sub}</div>
            ) : null}
            {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
        </div>
    );
}

/* ─── KitErrorBanner — flat danger card ───────────────────────────── */
export function KitErrorBanner({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="k-card"
            style={{
                padding: "10px 14px",
                background: "var(--color-danger-soft)",
                borderColor: "rgba(196,53,84,0.18)",
                color: "var(--color-danger)",
                fontSize: 12.5,
                marginBottom: 14,
            }}
        >
            {message}
        </div>
    );
}

/* ─── KitDialog — modal with backdrop + close ─────────────────────── */
export function KitDialog({
    title,
    onClose,
    children,
    maxWidth = 460,
    footer,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: number;
    footer?: React.ReactNode;
}) {
    return (
        <div
            role="dialog"
            aria-modal
            aria-label={title}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,16,18,0.45)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: 16,
            }}
        >
            <div
                className="k-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth,
                    width: "100%",
                    boxShadow: "0 16px 48px rgba(15,16,18,0.18)",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "90vh",
                }}
            >
                <div className="k-card__head">
                    <div className="k-card__title">{title}</div>
                    <button
                        type="button"
                        className="btn-kit btn-kit-ghost"
                        aria-label="Close"
                        onClick={onClose}
                        style={{ height: 26, width: 26, padding: 0, fontSize: 16, lineHeight: 1 }}
                    >
                        ×
                    </button>
                </div>
                <div
                    className="k-card__body"
                    style={{ display: "grid", gap: 10, overflowY: "auto", flex: 1 }}
                >
                    {children}
                </div>
                {footer ? (
                    <div
                        style={{
                            borderTop: "1px solid var(--color-hairline)",
                            padding: "12px 18px",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                        }}
                    >
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/* ─── KitToast — top-right success notice ─────────────────────────── */
export function KitToast({
    message,
    tone = "success",
}: {
    message: string;
    tone?: "success" | "danger" | "warning";
}) {
    const dot =
        tone === "danger"
            ? "var(--color-danger)"
            : tone === "warning"
                ? "var(--color-warning)"
                : "var(--color-success)";
    return (
        <div
            role="status"
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 9999,
                background: "var(--color-surface)",
                color: "var(--ink)",
                border: "1px solid var(--color-hairline)",
                borderRadius: 8,
                padding: "10px 14px",
                boxShadow: "0 6px 22px rgba(15,16,18,0.10)",
                fontSize: 12.5,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: 360,
            }}
        >
            <span
                aria-hidden
                style={{ width: 6, height: 6, borderRadius: 999, background: dot }}
            />
            {message}
        </div>
    );
}

/* ─── KitSpinner — small inline spinner using kit ink ─────────────── */
export function KitSpinner({ size = 16 }: { size?: number }) {
    return (
        <span
            aria-hidden
            style={{
                display: "inline-block",
                width: size,
                height: size,
                border: "2px solid var(--color-hairline)",
                borderTopColor: "var(--ink)",
                borderRadius: "50%",
                animation: "kitspin 0.9s linear infinite",
            }}
        />
    );
}

/* ─── KitLoadingBlock — centered spinner + caption ────────────────── */
export function KitLoadingBlock({ label = "Loading…" }: { label?: string }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "48px 16px",
                color: "var(--ink-3)",
            }}
        >
            <KitSpinner size={24} />
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>
            <style>{`@keyframes kitspin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}

/* ─── KitSkeleton — shimmering placeholder block ─────────────────── */
export function KitSkeleton({
    width,
    height,
    radius = 6,
    style,
}: {
    width?: number | string;
    height?: number | string;
    radius?: number;
    style?: React.CSSProperties;
}) {
    return (
        <div
            aria-hidden
            style={{
                width,
                height,
                borderRadius: radius,
                background:
                    "linear-gradient(90deg, var(--color-surface-2) 0%, var(--color-hairline) 50%, var(--color-surface-2) 100%)",
                backgroundSize: "200% 100%",
                animation: "kit-shimmer 1.4s ease-in-out infinite",
                ...style,
            }}
        />
    );
}

/* ─── KitSegmented — small segmented control ──────────────────────── */
export function KitSegmented<T extends string>({
    options,
    value,
    onChange,
    size = "md",
}: {
    options: ReadonlyArray<{ value: T; label: string; icon?: React.ReactNode }>;
    value: T;
    onChange: (v: T) => void;
    size?: "sm" | "md";
}) {
    const h = size === "sm" ? 26 : 30;
    return (
        <div
            role="tablist"
            style={{
                display: "inline-flex",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-hairline)",
                borderRadius: 8,
                padding: 2,
                gap: 0,
            }}
        >
            {options.map((opt) => {
                const selected = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(opt.value)}
                        style={{
                            height: h,
                            padding: "0 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 500,
                            color: selected ? "var(--ink)" : "var(--ink-2)",
                            background: selected ? "var(--color-surface)" : "transparent",
                            border: selected
                                ? "1px solid var(--color-hairline)"
                                : "1px solid transparent",
                            borderRadius: 6,
                            cursor: "pointer",
                            letterSpacing: "-0.005em",
                            transition: "all 120ms ease",
                        }}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ─── Convenience: re-export Icon so consumers can `import { Icon }` */
export { Icon };
