"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Student · Learning Path (AI) — 1:1 port of the TRILINK kit's
 * `<LearningPath/>` (`pages.jsx` lines 475–694). Hero, subject pills,
 * "Focus this week" + "All topics" cards, and right rail (Tutor recommends
 * + Achievements) all reproduce the kit's exact JSX and copy.
 */
import { useState } from "react";
import { Icon, Pill, ProgressRing } from "@/components/kit";

type TopicStatus = "mastered" | "ok" | "weak";

interface Topic {
    name: string;
    mastery: number;
    status: TopicStatus;
}

const SUBJECTS = ["Calculus I", "Physics", "World History", "English Lit.", "Computer Science"] as const;

const TOPICS: ReadonlyArray<Topic> = [
    { name: "Functions & graphs",            mastery: 92, status: "mastered" },
    { name: "Polynomials",                   mastery: 88, status: "mastered" },
    { name: "Limits · direct substitution",  mastery: 81, status: "mastered" },
    { name: "Limits · indeterminate forms",  mastery: 38, status: "weak" },
    { name: "Continuity",                    mastery: 64, status: "ok" },
    { name: "Derivative · first principles", mastery: 72, status: "mastered" },
    { name: "Power & sum rule",              mastery: 84, status: "mastered" },
    { name: "Product & quotient rule",       mastery: 55, status: "ok" },
    { name: "Chain rule",                    mastery: 31, status: "weak" },
    { name: "Implicit differentiation",      mastery: 18, status: "weak" },
    { name: "Tangent & normal lines",        mastery: 60, status: "ok" },
    { name: "Higher derivatives",            mastery: 49, status: "ok" },
];

export default function LearningPathPage() {
    const [active, setActive] = useState<(typeof SUBJECTS)[number]>("Calculus I");
    const weakTopics = TOPICS.filter((t) => t.mastery < 40);
    const masteryAvg = Math.round(TOPICS.reduce((s, t) => s + t.mastery, 0) / TOPICS.length);
    const masteredCount = TOPICS.filter((t) => t.mastery >= 70).length;

    return (
        <div className="kit-page" data-role="student">
            <div className="lpath__hero">
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div className="lpath__ai-chip">
                        <Icon name="sparkles" /> AI-tailored · powered by BKT
                    </div>
                    <h1 className="lpath__h1">
                        Your roadmap for <span className="serif">{active}.</span>
                    </h1>
                    <div className="lpath__hero-sub">
                        Updated 14 min ago based on your last 3 attempts. Focus on indeterminate forms and the chain rule
                        this week — they unlock everything that follows.
                    </div>
                </div>
                <div style={{ display: "flex", gap: 24, alignItems: "center", position: "relative", zIndex: 1 }}>
                    <div style={{ textAlign: "center" }}>
                        <ProgressRing value={masteryAvg} size={64} label={`${masteryAvg}%`} tone="brand" />
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>Avg mastery</div>
                    </div>
                    <div style={{ height: 48, width: 1, background: "var(--hairline)" }} />
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: 500,
                                letterSpacing: "-0.022em",
                                color: "var(--ink)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {masteredCount}
                            <span style={{ color: "var(--ink-4)", fontSize: 16, fontWeight: 400 }}>
                                /{TOPICS.length}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>Topics mastered</div>
                    </div>
                </div>
            </div>

            {/* Subject pills */}
            <div
                style={{
                    display: "flex",
                    gap: 1,
                    marginBottom: 14,
                    background: "var(--surface-2)",
                    padding: 2,
                    borderRadius: 8,
                    width: "fit-content",
                    border: "1px solid var(--hairline)",
                }}
            >
                {SUBJECTS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setActive(s)}
                        style={{
                            padding: "5px 11px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: active === s ? 500 : 400,
                            background: active === s ? "var(--surface)" : "transparent",
                            color: active === s ? "var(--ink)" : "var(--ink-3)",
                            boxShadow: active === s ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                            border: 0,
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="grid-12">
                <div className="section-stack">
                    {/* Focus this week */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div
                                    className="k-card__title"
                                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: "var(--warning)",
                                        }}
                                    />
                                    Focus this week
                                </div>
                                <div className="k-card__sub">
                                    {weakTopics.length} topics below 40% mastery
                                </div>
                            </div>
                            <button type="button" className="btn-kit btn-kit-ai">
                                <Icon name="sparkles" /> Generate practice
                            </button>
                        </div>
                        <div style={{ padding: "4px 0" }}>
                            {weakTopics.map((t) => (
                                <div
                                    key={t.name}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "12px 16px",
                                        borderBottom: "1px solid var(--hairline)",
                                        position: "relative",
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 14,
                                            bottom: 14,
                                            width: 2,
                                            background: "var(--warning)",
                                        }}
                                    />
                                    <ProgressRing value={t.mastery} size={36} label={`${t.mastery}`} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="topic__title">{t.name}</div>
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--ink-3)",
                                                marginTop: 2,
                                                fontFamily: "var(--font-mono)",
                                            }}
                                        >
                                            Last attempt 2d ago · BKT {t.mastery}/100
                                        </div>
                                    </div>
                                    <Pill kind="pending">Needs work</Pill>
                                    <button type="button" className="btn-kit btn-kit-secondary">
                                        <Icon name="play" size={10} /> Practice
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* All topics */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">All topics in {active}</div>
                                <div className="k-card__sub">
                                    Mastery tracked with Bayesian Knowledge Tracing
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--ink-3)" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} /> &lt; 40
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning)" }} /> 40–69
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} /> 70+
                                </span>
                            </div>
                        </div>
                        <div className="topic-grid">
                            {TOPICS.map((t) => (
                                <div
                                    key={t.name}
                                    className={`topic ${t.status === "weak" ? "topic--weak" : ""}`}
                                >
                                    <ProgressRing value={t.mastery} size={36} label={`${t.mastery}`} />
                                    <div className="topic__body">
                                        <div className="topic__title">{t.name}</div>
                                        <div className="topic__meta">
                                            {t.status === "mastered" && (
                                                <>
                                                    <Icon name="check" size={11} />
                                                    <span style={{ color: "var(--success)" }}>Mastered</span>
                                                </>
                                            )}
                                            {t.status === "weak" && (
                                                <>
                                                    <Icon name="alertTri" size={11} />
                                                    <span style={{ color: "var(--warning)" }}>Needs work</span>
                                                </>
                                            )}
                                            {t.status === "ok" && <span>In progress</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="section-stack">
                    {/* Tutor recommends */}
                    <div
                        className="k-card"
                        style={{ background: "var(--brand-faint)", borderColor: "rgba(91,91,214,0.16)" }}
                    >
                        <div className="k-card__head" style={{ borderColor: "rgba(91,91,214,0.16)" }}>
                            <div>
                                <div
                                    className="k-card__title"
                                    style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--brand-ink)" }}
                                >
                                    <Icon name="sparkles" /> Tutor recommends
                                </div>
                            </div>
                        </div>
                        <div className="k-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p
                                style={{
                                    fontSize: 12.5,
                                    color: "var(--ink)",
                                    lineHeight: 1.55,
                                    margin: 0,
                                    letterSpacing: "-0.003em",
                                }}
                            >
                                Based on your last attempt, I&rsquo;ll start you with a 12-question warm-up on{" "}
                                <em>limits of indeterminate forms</em>, then move to <em>chain-rule mini-drills</em>.
                            </p>
                            <button
                                type="button"
                                className="btn-kit btn-kit-primary"
                                style={{ justifyContent: "center", height: 32 }}
                            >
                                <Icon name="play" /> Start 25-min session
                            </button>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 11,
                                    color: "var(--ink-3)",
                                    padding: "6px 8px",
                                    background: "var(--surface)",
                                    borderRadius: 6,
                                    border: "1px solid var(--hairline)",
                                }}
                            >
                                <span>Coverage</span>
                                <span
                                    style={{
                                        color: "var(--ink-2)",
                                        fontWeight: 500,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    3 topics · 28 Qs
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div className="k-card__title">Achievements</div>
                        </div>
                        <div
                            className="k-card__body"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                                background: "var(--hairline)",
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid var(--hairline)",
                            }}
                        >
                            {(
                                [
                                    { ico: "trophy", title: "14-day streak",                  note: "Personal best" },
                                    { ico: "star",   title: "3 topics mastered this week",    note: "Polynomials, Power rule, Sum rule" },
                                    { ico: "bolt",   title: "50 AI-tutor questions answered", note: "Earned 'Curious Mind' badge" },
                                ] as const
                            ).map((a, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "12px 14px",
                                        background: "var(--surface)",
                                    }}
                                >
                                    <Icon name={a.ico} size={14} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 12.5,
                                                fontWeight: 500,
                                                color: "var(--ink)",
                                                letterSpacing: "-0.005em",
                                            }}
                                        >
                                            {a.title}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                                            {a.note}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
