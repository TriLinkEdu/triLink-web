"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * CalendarKitPage — 1:1 port of the TRILINK kit's `<CalendarPage role />`
 * (`surfaces.jsx` lines 7-127). All visual structure, copy, and class names
 * match the kit; the only changes are TypeScript typings and using the
 * project's kit primitives.
 *
 * The kit ships static demo data for May 2026; we keep that to preserve the
 * exact visual; real calendar wiring can be layered in later.
 */
import { useState } from "react";
import { Icon, PageHead } from "@/components/kit";

type EventKind = "" | "neutral" | "success" | "warning" | "danger";
type EventDot = { t: string; kind: EventKind };
type View = "day" | "week" | "month";

const EVENTS: Record<number, EventDot[]> = {
    4:  [{ t: "Calculus quiz · 11A", kind: "" }],
    5:  [{ t: "Faculty meeting", kind: "neutral" }],
    7:  [{ t: "Algebra midterm release", kind: "success" }, { t: "Lab safety quiz", kind: "warning" }],
    8:  [{ t: "Sports day", kind: "warning" }],
    11: [{ t: "Library closed", kind: "neutral" }, { t: "Physics exam 11A", kind: "" }],
    12: [{ t: "Library closed", kind: "neutral" }],
    13: [{ t: "Library closed", kind: "neutral" }],
    14: [{ t: "World History · Ch4", kind: "success" }],
    15: [{ t: "Today: 3 exams running", kind: "danger" }, { t: "Parent-teacher", kind: "warning" }],
    18: [{ t: "PT week · day 1", kind: "warning" }],
    19: [{ t: "PT week · day 2", kind: "warning" }, { t: "AP Stats quiz", kind: "" }],
    20: [{ t: "PT week · day 3", kind: "warning" }],
    21: [{ t: "PT week · day 4", kind: "warning" }],
    22: [{ t: "PT week · day 5", kind: "warning" }, { t: "Track meet", kind: "success" }],
    25: [{ t: "Holiday · no school", kind: "neutral" }],
    27: [{ t: "Calculus midterm", kind: "" }],
    29: [{ t: "Science fair", kind: "success" }],
};

export function CalendarKitPage({ role }: { role: "admin" | "teacher" | "student" | "parent" }) {
    const [view, setView] = useState<View>("month");
    const [cursor, setCursor] = useState(new Date(2026, 4, 1));

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number; out: boolean }> = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, out: true });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, out: false });
    let next = 1;
    while (cells.length < 42) cells.push({ day: next++, out: true });

    const todayDay = 15;

    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={<>Schedule <span className="dot-sep">·</span> {EVENTS[15]?.length || 0} events today</>}
                title={cursor.toLocaleDateString([], { month: "long", year: "numeric" })}
                sub="Exams, assignments, attendance sessions, and school events."
                actions={
                    <>
                        <div className="segment" style={{ width: "auto" }}>
                            {(["Day", "Week", "Month"] as const).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    className={`segment__opt ${view === (v.toLowerCase() as View) ? "active" : ""}`}
                                    onClick={() => setView(v.toLowerCase() as View)}
                                    style={{ padding: "4px 10px" }}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        <button type="button" className="iconbtn" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
                            <Icon name="chevLeft" />
                        </button>
                        <button type="button" className="btn-kit btn-kit-ghost" onClick={() => setCursor(new Date(2026, 4, 1))}>Today</button>
                        <button type="button" className="iconbtn" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
                            <Icon name="chevRight" />
                        </button>
                        <button type="button" className="btn-kit btn-kit-primary"><Icon name="plus" /> Event</button>
                    </>
                }
            />

            <div className="cal-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="cal-day-head">{d}</div>
                ))}
                {cells.map((c, i) => {
                    const isToday = !c.out && c.day === todayDay && month === 4 && year === 2026;
                    const evs = !c.out ? EVENTS[c.day] || [] : [];
                    return (
                        <div key={i} className={`cal-day ${c.out ? "out" : ""} ${isToday ? "today" : ""}`}>
                            <div className="cal-day__num">{c.day}</div>
                            {evs.slice(0, 3).map((e, j) => (
                                <div key={j} className={`cal-event ${e.kind ? `cal-event--${e.kind}` : ""}`}>
                                    {e.t}
                                </div>
                            ))}
                            {evs.length > 3 && (
                                <div style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 500, paddingLeft: 6 }}>
                                    +{evs.length - 3} more
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11.5, color: "var(--ink-3)", alignItems: "center" }}>
                {[
                    ["Exam", "var(--brand-soft)"],
                    ["Assignment", "var(--success-soft)"],
                    ["School event", "var(--warning-soft)"],
                    ["Live now", "var(--danger-soft)"],
                    ["Other", "var(--surface-2)"],
                ].map(([label, bg]) => (
                    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: bg }} /> {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
