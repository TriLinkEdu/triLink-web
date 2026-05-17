"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Teacher · Live Exam Monitor — 1:1 port of the TRILINK kit's
 * `<LiveMonitor/>` (`pages.jsx` lines 253–470). Dark mission-critical
 * theme, exact table grid, activity log, WebSocket status row, and warning
 * modal all preserved from the kit.
 *
 * The screen renders inside our standard teacher shell; the kit's dark
 * `.proctor` panel takes over the content area as designed.
 */
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/kit";

type Status = "active" | "idle" | "violated" | "submitted";

interface Student {
    name: string;
    id: string;
    status: Status;
    progress: number;
    violations: number;
    time: string;
}

const BASE_STUDENTS: ReadonlyArray<Student> = [
    { name: "Aisha Bashir",   id: "S-1042", status: "active",    progress: 78,  violations: 0, time: "18:42" },
    { name: "Carlos Mendez",  id: "S-1043", status: "active",    progress: 65,  violations: 0, time: "18:42" },
    { name: "Priya Vaidya",   id: "S-1044", status: "violated",  progress: 45,  violations: 3, time: "18:38" },
    { name: "Jamal Robinson", id: "S-1045", status: "violated",  progress: 52,  violations: 5, time: "18:39" },
    { name: "Sofia Reyes",    id: "S-1046", status: "active",    progress: 82,  violations: 0, time: "18:42" },
    { name: "Ethan Walker",   id: "S-1047", status: "idle",      progress: 36,  violations: 1, time: "18:34" },
    { name: "Maya Chen",      id: "S-1048", status: "active",    progress: 88,  violations: 0, time: "18:42" },
    { name: "Noah Patel",     id: "S-1049", status: "submitted", progress: 100, violations: 0, time: "—" },
    { name: "Yuna Kim",       id: "S-1050", status: "active",    progress: 71,  violations: 0, time: "18:42" },
    { name: "Liam O'Connor",  id: "S-1051", status: "active",    progress: 67,  violations: 1, time: "18:42" },
    { name: "Aria Singh",     id: "S-1052", status: "active",    progress: 73,  violations: 0, time: "18:41" },
    { name: "Tomas Ferreira", id: "S-1053", status: "idle",      progress: 22,  violations: 0, time: "18:30" },
    { name: "Hana Suzuki",    id: "S-1054", status: "submitted", progress: 100, violations: 0, time: "—" },
    { name: "Eli Goldberg",   id: "S-1055", status: "active",    progress: 60,  violations: 0, time: "18:42" },
];

const STATUS_LABEL: Record<Status, string> = {
    active: "Active",
    idle: "Idle",
    violated: "Violated",
    submitted: "Submitted",
};

export default function LiveMonitorPage() {
    const [students, setStudents] = useState<Student[]>(() => [...BASE_STUDENTS]);
    const [warned, setWarned] = useState<string | null>(null);

    useEffect(() => {
        const t = setInterval(() => {
            setStudents((prev) =>
                prev.map((s) => {
                    if (s.status === "active" || s.status === "violated") {
                        return {
                            ...s,
                            progress: Math.min(100, s.progress + Math.floor(Math.random() * 3)),
                        };
                    }
                    return s;
                }),
            );
        }, 2400);
        return () => clearInterval(t);
    }, []);

    const counts = useMemo(() => {
        const c: Record<Status, number> = { active: 0, idle: 0, violated: 0, submitted: 0 };
        students.forEach((s) => {
            c[s.status]++;
        });
        return c;
    }, [students]);

    const logLines = [
        { t: "18:42:12", k: "ok",    text: <><strong>S-1048</strong> · maya.chen — answered Q14</> },
        { t: "18:42:08", k: "warn",  text: <><strong>S-1047</strong> · ethan.walker — idle 90s, polling…</> },
        { t: "18:41:55", k: "alert", text: <><strong>S-1045</strong> · jamal.robinson — TAB_SWITCH (#5)</> },
        { t: "18:41:42", k: "ok",    text: <><strong>S-1046</strong> · sofia.reyes — flagged Q9</> },
        { t: "18:41:31", k: "alert", text: <><strong>S-1044</strong> · priya.vaidya — FULLSCREEN_EXIT (#3)</> },
        { t: "18:41:18", k: "ok",    text: <><strong>S-1042</strong> · aisha.bashir — answered Q12</> },
        { t: "18:41:02", k: "warn",  text: <>WARNING sent to <strong>S-1045</strong></> },
        { t: "18:40:48", k: "ok",    text: <><strong>S-1049</strong> · noah.patel — SUBMITTED (final)</> },
        { t: "18:40:21", k: "ok",    text: <><strong>S-1050</strong> · yuna.kim — answered Q8</> },
        { t: "18:39:55", k: "alert", text: <><strong>S-1044</strong> · priya.vaidya — COPY_ATTEMPT</> },
        { t: "18:39:32", k: "ok",    text: <><strong>S-1054</strong> · hana.suzuki — SUBMITTED (final)</> },
        { t: "18:38:58", k: "ok",    text: <><strong>S-1043</strong> · carlos.mendez — answered Q11</> },
        { t: "18:38:14", k: "ok",    text: <><strong>S-1052</strong> · aria.singh — answered Q7</> },
    ] as const;

    return (
        <div className="proctor">
            <div className="proctor__main">
                <div className="proctor__head">
                    <div>
                        <div className="proctor__head-meta">
                            <span className="proctor__live">Live · 14 proctored</span>
                            <span style={{ color: "#3a3a3e" }}>·</span>
                            <span style={{ fontFamily: "var(--font-mono)", color: "#6f6f74" }}>EXAM-2611-A</span>
                            <span style={{ color: "#3a3a3e" }}>·</span>
                            <span>started 19:00</span>
                        </div>
                        <div className="proctor__h1">Calculus I · Pop Quiz · Grade 11 A</div>
                        <div className="proctor__sub">25 questions · 25 minutes · min-stay enforced</div>
                    </div>
                    <div className="proctor__metrics">
                        <div className="proctor__metric">
                            <div className="proctor__metric-val" style={{ color: "#19c97c" }}>{counts.active}</div>
                            <div className="proctor__metric-lbl">Active</div>
                        </div>
                        <div className="proctor__metric">
                            <div className="proctor__metric-val" style={{ color: "#e3a73c" }}>{counts.idle}</div>
                            <div className="proctor__metric-lbl">Idle</div>
                        </div>
                        <div className="proctor__metric">
                            <div className="proctor__metric-val" style={{ color: "#ed5070" }}>{counts.violated}</div>
                            <div className="proctor__metric-lbl">Violated</div>
                        </div>
                        <div className="proctor__metric">
                            <div className="proctor__metric-val" style={{ color: "#8c8c92" }}>{counts.submitted}</div>
                            <div className="proctor__metric-lbl">Submitted</div>
                        </div>
                        <div className="proctor__metric">
                            <div className="proctor__metric-val" style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>22:18</div>
                            <div className="proctor__metric-lbl">Time left</div>
                        </div>
                    </div>
                </div>

                <div className="proctor__table">
                    <div className="proctor__table-head">
                        <div>Student</div>
                        <div>Status</div>
                        <div>Violations</div>
                        <div>Last act</div>
                        <div>Progress</div>
                        <div style={{ textAlign: "right" }}>Actions</div>
                    </div>
                    {students.map((s) => (
                        <div key={s.id} className="proctor__row">
                            <div className="proctor__student">
                                <div className="proctor__avatar">
                                    {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div>
                                    <div className="proctor__name">{s.name}</div>
                                    <div className="proctor__id">{s.id}</div>
                                </div>
                            </div>
                            <div>
                                <span className={`pstat pstat--${s.status}`}>{STATUS_LABEL[s.status]}</span>
                            </div>
                            <div>
                                <span className={`vbadge ${s.violations === 0 ? "vbadge--none" : ""}`}>
                                    {s.violations === 0 ? "—" : `× ${s.violations}`}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 11.5,
                                    color: s.status === "idle" ? "#e3a73c" : "#6f6f74",
                                }}
                            >
                                {s.time}
                            </div>
                            <div>
                                <div className="proctor__progress">
                                    <div
                                        className={`proctor__progress-fill ${s.status === "violated" ? "proctor__progress-fill--danger" : s.status === "submitted" ? "proctor__progress-fill--submitted" : ""}`}
                                        style={{ width: `${s.progress}%` }}
                                    />
                                </div>
                                <div
                                    style={{
                                        marginTop: 5,
                                        fontSize: 10.5,
                                        color: "#6f6f74",
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    {s.progress}% · Q{Math.max(1, Math.round(s.progress * 0.25))}
                                </div>
                            </div>
                            <div className="proctor__actions">
                                <button type="button" className="proctor__btn" onClick={() => setWarned(s.name)}>
                                    Warn
                                </button>
                                <button type="button" className="proctor__btn proctor__btn--danger">
                                    Force submit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <aside className="proctor__side">
                <div className="proctor__side-h">
                    <div className="proctor__side-title">Activity feed</div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6f6f74" }}>
                        <Icon name="refresh" size={11} /> auto-tail
                    </span>
                </div>
                <div className="proctor__log">
                    {logLines.map((l, i) => (
                        <div key={i} className={`plog__line plog__line--${l.k}`}>
                            <span className="plog__time">{l.t}</span>
                            <span>{l.text}</span>
                        </div>
                    ))}
                </div>

                <div className="proctor__ws">
                    <span className="dot" />
                    <div style={{ flex: 1 }}>
                        <div className="proctor__ws-text">WebSocket connected</div>
                        <div className="proctor__ws-meta">wss://trilink.io/proctor/2611A · 14/14 peers</div>
                    </div>
                </div>

                <div className="proctor__warning">
                    <div className="proctor__warning-h">
                        <Icon name="alertTri" size={12} /> 2 students at violation cap
                    </div>
                    <div className="proctor__warning-b">
                        Jamal R. (5) and Priya V. (3) are about to auto-submit. Warn or force-submit before threshold.
                    </div>
                </div>
            </aside>

            {warned ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Send warning"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.65)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                    }}
                    onClick={() => setWarned(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#111114",
                            borderRadius: 12,
                            padding: "20px 22px",
                            width: 440,
                            border: "1px solid #1c1c1f",
                            color: "#e6e6e8",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Icon name="megaphone" size={14} />
                            <div style={{ fontWeight: 500, fontSize: 13.5, color: "#fff" }}>Warning · {warned}</div>
                        </div>
                        <textarea
                            defaultValue="Please stay on the exam tab. This is your final warning before auto-submit."
                            style={{
                                width: "100%",
                                minHeight: 84,
                                background: "#08080a",
                                color: "#e6e6e8",
                                border: "1px solid #1c1c1f",
                                borderRadius: 8,
                                padding: "10px 12px",
                                fontSize: 12.5,
                                fontFamily: "inherit",
                                outline: "none",
                            }}
                        />
                        <div style={{ display: "flex", gap: 6, marginTop: 14, justifyContent: "flex-end" }}>
                            <button type="button" className="proctor__btn" onClick={() => setWarned(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="proctor__btn proctor__btn--danger"
                                onClick={() => setWarned(null)}
                            >
                                Send warning
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
