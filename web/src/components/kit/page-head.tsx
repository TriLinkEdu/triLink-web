/**
 * PageHead — TRILINK kit's page heading row, exact port.
 *
 *   <PageHead
 *     meta={<><span className="role-dot"/> Northwood · Term 2 <span className="dot-sep">·</span><span className="live-chip">Live</span></>}
 *     title="Command center"
 *     sub="Everything happening across the school today."
 *     actions={<><button className="btn-kit btn-kit-secondary">Export</button>…</>}
 *   />
 */
import type { ReactNode } from "react";

export interface PageHeadProps {
    meta?: ReactNode;
    title: ReactNode;
    sub?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function PageHead({
    meta,
    title,
    sub,
    actions,
    className,
}: PageHeadProps) {
    return (
        <div className={`phead ${className ?? ""}`.trim()}>
            <div style={{ minWidth: 0 }}>
                {meta ? <div className="phead__meta">{meta}</div> : null}
                <h1 className="phead__title">{title}</h1>
                {sub ? <div className="phead__sub">{sub}</div> : null}
            </div>
            {actions ? <div className="phead__actions">{actions}</div> : null}
        </div>
    );
}
