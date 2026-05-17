"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Teacher · Grade Sheets — 1:1 port of the TRILINK kit's `<GradesRelease/>`
 * (`extras.jsx` lines 132–263). Exam tab strip, summary header, gtable
 * with per-row release toggle, all reproduced from the kit.
 */
import { useState } from "react";
import {
    Icon,
    KAvatar,
    PageHead,
    Pill,
} from "@/components/kit";

interface Exam {
    title: string;
    date: string;
    classes: string;
    n: number;
}

interface StudentRow {
    id: string;
    name: string;
    score: number;
    max: number;
    time: string;
    flags: number;
}

const EXAMS: Exam[] = [
    { title: "Midterm · Algebra II",  date: "12 Nov", classes: "Grade 10 A/B/C", n: 91 },
    { title: "Pop Quiz · Calculus I", date: "14 Nov", classes: "Grade 11 A",     n: 28 },
];

const STUDENTS: StudentRow[] = [
    { id: "S-1042", name: "Aisha Bashir",   score: 47, max: 50, time: "58:14", flags: 0 },
    { id: "S-1043", name: "Carlos Mendez",  score: 39, max: 50, time: "61:02", flags: 0 },
    { id: "S-1044", name: "Priya Vaidya",   score: 26, max: 50, time: "72:30", flags: 3 },
    { id: "S-1045", name: "Jamal Robinson", score: 31, max: 50, time: "58:00", flags: 5 },
    { id: "S-1046", name: "Sofia Reyes",    score: 48, max: 50, time: "54:46", flags: 0 },
    { id: "S-1047", name: "Ethan Walker",   score: 33, max: 50, time: "75:00", flags: 1 },
    { id: "S-1048", name: "Maya Chen",      score: 46, max: 50, time: "50:18", flags: 0 },
    { id: "S-1049", name: "Noah Patel",     score: 42, max: 50, time: "56:33", flags: 0 },
    { id: "S-1050", name: "Yuna Kim",       score: 44, max: 50, time: "55:14", flags: 0 },
    { id: "S-1051", name: "Liam O'Connor",  score: 36, max: 50, time: "64:08", flags: 1 },
];

const letter = (pct: number): string =>
    pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

export default function TeacherGradesPage() {
    const [active, setActive] = useState(EXAMS[0]!.title);
    const [released, setReleased] = useState<Record<string, boolean>>({
        "S-1042": true,
        "S-1046": true,
    });

    const releaseAll = () => {
        const all: Record<string, boolean> = {};
        STUDENTS.forEach((s) => {
            all[s.id] = true;
        });
        setReleased(all);
    };

    const toggle = (id: string) =>
        setReleased((prev) => ({ ...prev, [id]: !prev[id] }));

    const releasedCount = STUDENTS.filter((s) => released[s.id]).length;
    const avg = Math.round(
        STUDENTS.reduce((acc, st) => acc + (st.score / st.max) * 100, 0) / STUDENTS.length,
    );

    return (
        <div className="kit-page" data-role="teacher">
            <PageHead
                meta={
                    <>
                        Assessment <span className="dot-sep">·</span> {EXAMS.length} grade sheets
                    </>
                }
                title="Grade sheets"
                sub="Review, override, and release grades to students & parents."
                actions={
                    <>
                        <button type="button" className="btn-kit btn-kit-secondary">
                            <Icon name="download" /> Export
                        </button>
                        <button type="button" className="btn-kit btn-kit-primary" onClick={releaseAll}>
                            <Icon name="paperPlane" /> Release all
                        </button>
                    </>
                }
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {EXAMS.map((e) => (
                    <button
                        key={e.title}
                        type="button"
                        onClick={() => setActive(e.title)}
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: `1px solid ${active === e.title ? "var(--hairline-3)" : "var(--hairline)"}`,
                            background: active === e.title ? "var(--surface)" : "transparent",
                            textAlign: "left",
                            minWidth: 220,
                            transition: "all 120ms",
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: active === e.title ? "var(--ink)" : "var(--ink-2)",
                            }}
                        >
                            {e.title}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                            {e.date} · {e.classes} · {e.n} students
                        </div>
                    </button>
                ))}
            </div>

            <div className="k-card">
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">{active}</div>
                        <div className="k-card__sub">
                            {STUDENTS.length} students · {releasedCount} released · avg{" "}
                            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-2)" }}>
                                {avg}%
                            </span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Pill kind="brand">
                            <Icon name="sparkles" size={10} /> 2 outliers
                        </Pill>
                        <button type="button" className="btn-kit btn-kit-ghost">
                            <Icon name="filter" /> Filter
                        </button>
                    </div>
                </div>
                <table className="gtable">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>ID</th>
                            <th>Score</th>
                            <th>Grade</th>
                            <th>Time</th>
                            <th>Flags</th>
                            <th style={{ textAlign: "right" }}>Release</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STUDENTS.map((s) => {
                            const pct = Math.round((s.score / s.max) * 100);
                            const initials = s.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("");
                            return (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <KAvatar initials={initials} />
                                            <b>{s.name}</b>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-3)" }}>
                                        {s.id}
                                    </td>
                                    <td>
                                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                                            <b>{s.score}</b>
                                            <span style={{ color: "var(--ink-4)" }}>/{s.max}</span>
                                            <span style={{ color: "var(--ink-3)", fontSize: 11.5, marginLeft: 8 }}>
                                                {pct}%
                                            </span>
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                fontSize: 13,
                                                color:
                                                    pct >= 80
                                                        ? "var(--success)"
                                                        : pct >= 60
                                                          ? "var(--warning)"
                                                          : "var(--danger)",
                                            }}
                                        >
                                            {letter(pct)}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-3)" }}>
                                        {s.time}
                                    </td>
                                    <td>
                                        {s.flags > 0 ? (
                                            <Pill kind="danger">× {s.flags}</Pill>
                                        ) : (
                                            <span style={{ color: "var(--ink-4)" }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button
                                            type="button"
                                            className={`toggle ${released[s.id] ? "on" : ""}`}
                                            onClick={() => toggle(s.id)}
                                            aria-label={`Toggle release for ${s.name}`}
                                            aria-pressed={released[s.id] ? "true" : "false"}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
