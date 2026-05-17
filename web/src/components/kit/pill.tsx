/**
 * Pill — TRILINK kit's status chip, exact port.
 *
 * Usage (matches kit JSX 1:1):
 *   <Pill kind="active">Released</Pill>
 *   <Pill kind="brand" dot={false}>AI</Pill>
 */
import type { ReactNode } from "react";

export type PillKind =
    | "neutral"
    | "active"
    | "pending"
    | "danger"
    | "brand"
    | "solid";

export interface PillProps {
    kind?: PillKind;
    /** @deprecated wave-1 alias for `kind`. */
    intent?: PillKind | "warning" | "ink";
    dot?: boolean;
    children: ReactNode;
    className?: string;
}

const intentToKind = (intent: PillProps["intent"]): PillKind => {
    if (intent === "warning") return "pending";
    if (intent === "ink") return "neutral";
    return intent ?? "neutral";
};

export function Pill({
    kind,
    intent,
    dot = true,
    children,
    className,
}: PillProps) {
    const resolved: PillKind = kind ?? intentToKind(intent);
    return (
        <span className={`k-pill k-pill--${resolved} ${className ?? ""}`.trim()}>
            {dot ? <span className="b-dot" /> : null}
            {children}
        </span>
    );
}

/** Legacy alias kept for back-compat with earlier wave-1 callsites. */
export type PillIntent = PillKind | "warning" | "ink";
