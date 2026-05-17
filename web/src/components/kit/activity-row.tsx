/**
 * ActivityRow — TRILINK kit's universal row primitive, exact port.
 *
 * The same primitive is reused across portals for "Recent activity",
 * "Audit log", "Teacher snapshot", "Announcements feed", etc.
 *
 * Usage:
 *   <ActivityRow
 *     icon="paper"
 *     title="Algebra II · Midterm released"
 *     detail="142 students notified"
 *     type="Exam"
 *     status={<Pill kind="active">Released</Pill>}
 *     date="2 hr ago"
 *   />
 */
import type { ReactNode } from "react";
import { Icon, type KitIconName } from "./icon";

export interface ActivityRowProps {
    icon: KitIconName;
    title: ReactNode;
    detail?: ReactNode;
    type?: ReactNode;
    status?: ReactNode;
    date?: ReactNode;
    onClick?: () => void;
}

export function ActivityRow({
    icon,
    title,
    detail,
    type,
    status,
    date,
    onClick,
}: ActivityRowProps) {
    return (
        <div
            className="k-row"
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="k-row__icon">
                <Icon name={icon} />
            </div>
            <div>
                <div className="k-row__title">{title}</div>
                {detail ? <div className="k-row__detail">{detail}</div> : null}
            </div>
            <div className="k-row__type">{type}</div>
            <div>{status}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="k-row__date">{date}</span>
                <Icon name="chev" size={12} className="k-row__chev" />
            </div>
        </div>
    );
}
