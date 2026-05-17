/**
 * ProgressRing — TRILINK kit's thin-stroke radial progress, exact port.
 *
 *   <ProgressRing value={72} size={48} label="72" tone="ink" />
 */
import type { ReactNode } from "react";

export interface ProgressRingProps {
    value?: number;
    size?: number;
    label?: ReactNode;
    tone?: "auto" | "brand" | "ink" | "success";
}

export function ProgressRing({
    value = 0,
    size = 36,
    label,
    tone = "auto",
}: ProgressRingProps) {
    const sw = size >= 60 ? 3 : 2.5;
    const r = (size - sw - 2) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(100, value));
    const dash = c * (1 - v / 100);
    const stroke =
        tone === "auto"
            ? v >= 70
                ? "#0d8a5f"
                : v >= 40
                  ? "#b07000"
                  : "#c43554"
            : tone === "brand"
              ? "#5b5bd6"
              : tone === "ink"
                ? "#0e0e10"
                : "#0d8a5f";
    return (
        <div className={`ring ${size >= 60 ? "ring--lg" : ""}`} style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`}>
                <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    className="ring__fill"
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeDasharray={c}
                    strokeDashoffset={dash}
                />
            </svg>
            <div className="ring__text">{label != null ? label : `${Math.round(v)}`}</div>
        </div>
    );
}
