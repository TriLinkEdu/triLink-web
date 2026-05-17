/**
 * StatTile + StatGrid — TRILINK kit's KPI surface, exact port.
 *
 * Usage (matches kit JSX 1:1):
 *   <div className="stat-grid cols-6">
 *     <StatTile icon="users" label="Students" value="2,481"
 *               delta="+34" deltaDir="up" note="30d" />
 *   </div>
 */
import type { ReactNode } from "react";
import { Icon, type KitIconName } from "./icon";

export interface StatTileProps {
    /** Icon name from the kit's Lucide set. */
    icon?: KitIconName;
    /** Custom icon node (used when callers pass a Lucide element directly). */
    labelIcon?: ReactNode;
    label: ReactNode;
    value: ReactNode;
    note?: ReactNode;
    delta?: string | number;
    deltaDir?: "up" | "down";
}

export function StatTile({
    icon,
    labelIcon,
    label,
    value,
    note,
    delta,
    deltaDir,
}: StatTileProps) {
    return (
        <div className="stat">
            <div className="stat__label">
                {icon ? <Icon name={icon} /> : labelIcon}
                <span>{label}</span>
            </div>
            <div className="stat__value">{value}</div>
            <div className="stat__note">
                {delta != null ? (
                    <span
                        className={`stat__delta stat__delta--${deltaDir === "up" ? "up" : "down"}`}
                    >
                        <Icon name={deltaDir === "up" ? "arrowUp" : "arrowDown"} size={10} />
                        {delta}
                    </span>
                ) : null}
                {note ? <span>{note}</span> : null}
            </div>
        </div>
    );
}

export interface StatGridProps {
    cols?: 3 | 4 | 6;
    className?: string;
    style?: React.CSSProperties;
    children: ReactNode;
}

export function StatGrid({ cols = 4, className, style, children }: StatGridProps) {
    return (
        <div
            className={`stat-grid cols-${cols} ${className ?? ""}`.trim()}
            style={style}
        >
            {children}
        </div>
    );
}
