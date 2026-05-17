"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    getExamStudentRoster,
    controlExamAttempt,
    type ExamRosterStudent,
    type Exam
} from "@/lib/admin-api";
import { chatRealtime } from "@/lib/chat-realtime";
import { useConfirm } from "@/hooks/useConfirm";

interface ExamMonitorProps {
    exam: Exam;
    onClose: () => void;
}

export default function ExamMonitor({ exam, onClose }: ExamMonitorProps) {
    const { confirm: confirmDialog, element: confirmEl } = useConfirm();
    const [students, setStudents] = useState<ExamRosterStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWarnModal, setShowWarnModal] = useState<{ attemptId: string; studentName: string } | null>(null);
    const [warnMsg, setWarnMsg] = useState("Please focus on your exam and avoid switching tabs.");
    const [actionError, setActionError] = useState<string | null>(null);
    const [activity, setActivity] = useState<Array<{ id: string; text: string; at: string }>>([]);
    const [rtStatus, setRtStatus] = useState<string>("idle");
    const studentsRef = useRef<ExamRosterStudent[]>([]);

    const resolveStudentName = (student: Partial<ExamRosterStudent> | null | undefined) => {
        const full = `${student?.firstName || ""} ${student?.lastName || ""}`.trim();
        return full || student?.email || "Unknown student";
    };

    const setStudentsWithRef = (next: ExamRosterStudent[] | ((prev: ExamRosterStudent[]) => ExamRosterStudent[])) => {
        setStudents((prev) => {
            const resolved = typeof next === "function" ? (next as (p: ExamRosterStudent[]) => ExamRosterStudent[])(prev) : next;
            studentsRef.current = resolved;
            return resolved;
        });
    };

    const pushActivity = (text: string) => {
        setActivity((prev) => [{ id: `${Date.now()}-${Math.random()}`, text, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    };

    const fetchRoster = async () => {
        try {
            const data = await getExamStudentRoster(exam.id);
            setStudentsWithRef(data.students);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load roster");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
        const interval = setInterval(fetchRoster, 10000);

        const unsubStatus = chatRealtime.on("status", (status) => {
            setRtStatus(status);
        });

        const unsubViolation = chatRealtime.on("attempt:violation", (payload) => {
            if (payload.examId !== exam.id) return;
            setStudentsWithRef(prev => prev.map(s => {
                if (s.studentId === payload.studentId) {
                    return { ...s, violationCount: payload.violationCount, status: "in_progress" };
                }
                return s;
            }));
            const who = studentsRef.current.find((s) => s.studentId === payload.studentId);
            const name = resolveStudentName(who);
            const reason = payload.reason ? ` — ${payload.reason}` : "";
            pushActivity(`Violation: ${name} (${payload.violationCount})${reason}`);
        });

        const unsubActivity = chatRealtime.on("attempt:activity", (payload) => {
            if (payload.examId !== exam.id) return;
            setStudentsWithRef((prev) => prev.map((s) => {
                if (s.studentId !== payload.studentId) return s;
                if (payload.kind === "submit" || payload.kind === "force_submit") {
                    return { ...s, status: "submitted", isLocked: false } as ExamRosterStudent;
                }
                if (payload.kind === "locked") {
                    return { ...s, status: "in_progress", isLocked: true, lockReason: payload.reason ?? "Locked by policy" } as ExamRosterStudent;
                }
                if (payload.kind === "allow_rejoin") {
                    return { ...s, isLocked: false, reentryAllowed: true } as ExamRosterStudent;
                }
                if (payload.kind === "start" || payload.kind === "resume") {
                    return { ...s, status: "in_progress" } as ExamRosterStudent;
                }
                return s;
            }));
            const label = payload.kind.replace(/_/g, " ");
            const who = studentsRef.current.find((s) => s.studentId === payload.studentId);
            const name = resolveStudentName(who);
            const reason = payload.reason ? ` — ${payload.reason}` : "";
            pushActivity(`${label.toUpperCase()}: ${name}${reason}`);
        });

        const unsubMessage = chatRealtime.on("message:new", () => {
            // proctoring focus
        });

        return () => {
            clearInterval(interval);
            unsubStatus();
            unsubViolation();
            unsubActivity();
            unsubMessage();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exam.id]);

    const handleControl = async (attemptId: string, action: "force_submit" | "warn" | "allow_rejoin") => {
        if (!attemptId) return;
        setActionError(null);
        try {
            await controlExamAttempt(attemptId, action, action === "warn" ? warnMsg : undefined);
            if (action === "warn") setShowWarnModal(null);
            if (action === "allow_rejoin") pushActivity("Teacher allowed student rejoin.");
            fetchRoster();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Control action failed");
        }
    };

    const inProgressCount = students.filter(s => s.status === "in_progress").length;
    const submittedCount = students.filter(s => s.status === "submitted").length;
    const activeStudents = students.filter((s) => s.status === "in_progress");

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,16,18,0.42)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: 24,
            }}
        >
            {actionError && (
                <div
                    role="alert"
                    style={{
                        position: "fixed",
                        top: 20,
                        right: 20,
                        zIndex: 1200,
                        maxWidth: 340,
                        borderRadius: 10,
                        background: "var(--color-surface)",
                        color: "var(--color-danger)",
                        border: "1px solid rgba(196,53,84,0.22)",
                        boxShadow: "0 12px 40px rgba(15,16,18,0.14)",
                        padding: "10px 14px",
                        fontSize: 12.5,
                        fontWeight: 500,
                    }}
                >
                    {actionError}
                </div>
            )}
            <div
                className="k-card"
                style={{
                    width: "100%",
                    maxWidth: 1040,
                    height: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    padding: 0,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "16px 22px",
                        borderBottom: "1px solid var(--color-hairline)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "var(--color-surface)",
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "var(--ink-3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: 2,
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background:
                                        rtStatus === "open"
                                            ? "var(--color-success)"
                                            : "var(--color-warning)",
                                    display: "inline-block",
                                }}
                            />
                            Live proctoring
                        </div>
                        <h2
                            style={{
                                fontSize: 18,
                                fontWeight: 500,
                                letterSpacing: "-0.018em",
                                color: "var(--ink)",
                                margin: 0,
                            }}
                        >
                            {exam.title}
                        </h2>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                            <div
                                style={{
                                    fontSize: 10.5,
                                    fontWeight: 500,
                                    color: "var(--ink-3)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                Active students
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 500,
                                    color: "var(--ink)",
                                    fontVariantNumeric: "tabular-nums",
                                    letterSpacing: "-0.012em",
                                }}
                            >
                                {inProgressCount}
                                <span style={{ fontSize: 12, color: "var(--ink-3)" }}> / {students.length}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close monitor"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: "1px solid var(--color-hairline)",
                                background: "var(--color-surface)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--ink-2)",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: 22, background: "var(--color-bg)" }}>
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-3)", fontSize: 13 }}>
                            Loading proctoring data…
                        </div>
                    ) : error ? (
                        <div style={{ color: "var(--color-danger)", textAlign: "center", padding: 32, fontSize: 13 }}>{error}</div>
                    ) : (
                        <div style={{ display: "grid", gap: 14 }}>
                            <div className="k-card" style={{ padding: "12px 14px" }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: "var(--ink-3)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        marginBottom: 8,
                                    }}
                                >
                                    Active students
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {activeStudents.length === 0 ? (
                                        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>No active students yet.</span>
                                    ) : (
                                        activeStudents.map((s) => (
                                            <span
                                                key={s.studentId}
                                                className="k-pill"
                                                style={{
                                                    background: "var(--color-success-soft)",
                                                    color: "var(--color-success)",
                                                    border: "1px solid rgba(13,138,95,0.22)",
                                                    fontSize: 11,
                                                }}
                                            >
                                                {resolveStudentName(s)}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                                    {students.map((s) => {
                                        const active = s.status === "in_progress";
                                        const submitted = s.status === "submitted";
                                        return (
                                            <div
                                                key={s.studentId}
                                                className="k-card"
                                                style={{
                                                    padding: 14,
                                                    background: submitted ? "var(--color-surface-2)" : "var(--color-surface)",
                                                    opacity: s.status === "not_started" ? 0.6 : 1,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        marginBottom: 10,
                                                        alignItems: "flex-start",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: 8,
                                                                background: submitted ? "var(--color-success-soft)" : "var(--color-surface-2)",
                                                                color: submitted ? "var(--color-success)" : "var(--ink-2)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: 11,
                                                                fontWeight: 500,
                                                                border: "1px solid var(--color-hairline)",
                                                            }}
                                                        >
                                                            {(s.firstName?.[0] || "") + (s.lastName?.[0] || "")}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div
                                                                style={{
                                                                    fontSize: 13.5,
                                                                    fontWeight: 500,
                                                                    color: "var(--ink)",
                                                                    letterSpacing: "-0.012em",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {s.firstName} {s.lastName}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: 5,
                                                                    fontSize: 11,
                                                                    fontWeight: 500,
                                                                    color: active ? "var(--color-success)" : submitted ? "var(--ink-2)" : "var(--ink-3)",
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.04em",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        width: 6,
                                                                        height: 6,
                                                                        borderRadius: "50%",
                                                                        background: active ? "var(--color-success)" : submitted ? "var(--ink-2)" : "var(--ink-4)",
                                                                        display: "inline-block",
                                                                    }}
                                                                />
                                                                {active ? "Live" : submitted ? "Complete" : "Idle"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(s.violationCount > 0 || s.isLocked) && (
                                                        <span
                                                            className="k-pill"
                                                            style={{
                                                                background: "var(--color-danger-soft)",
                                                                color: "var(--color-danger)",
                                                                border: "1px solid rgba(196,53,84,0.22)",
                                                                fontSize: 10.5,
                                                            }}
                                                        >
                                                            {s.isLocked ? "Locked" : `${s.violationCount} ${s.violationCount === 1 ? "violation" : "violations"}`}
                                                        </span>
                                                    )}
                                                </div>

                                                {s.isLocked && (
                                                    <div
                                                        style={{
                                                            marginBottom: 10,
                                                            fontSize: 12,
                                                            color: "var(--color-danger)",
                                                            fontWeight: 400,
                                                            lineHeight: 1.45,
                                                        }}
                                                    >
                                                        Locked: {s.lockReason || "Student left protected mode"}
                                                    </div>
                                                )}

                                                {active && s.attemptId && (
                                                    <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowWarnModal({ attemptId: s.attemptId!, studentName: `${s.firstName} ${s.lastName}` })}
                                                            className="btn-kit btn-kit-warning"
                                                            style={{ flex: 1, justifyContent: "center" }}
                                                        >
                                                            Warn
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const ok = await confirmDialog({
                                                                    title: "Force submit exam?",
                                                                    message: `This will submit the in-progress attempt for ${s.firstName} ${s.lastName}. They will not be able to continue.`,
                                                                    confirmLabel: "Force submit",
                                                                    destructive: true,
                                                                });
                                                                if (ok) {
                                                                    handleControl(s.attemptId!, "force_submit");
                                                                }
                                                            }}
                                                            className="btn-kit btn-kit-danger"
                                                            style={{ flex: 1, justifyContent: "center" }}
                                                        >
                                                            Force submit
                                                        </button>
                                                    </div>
                                                )}

                                                {s.attemptId && s.isLocked && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleControl(s.attemptId!, "allow_rejoin")}
                                                        className="btn-kit btn-kit-primary"
                                                        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                                                    >
                                                        Allow rejoin
                                                    </button>
                                                )}

                                                {submitted && (
                                                    <div
                                                        style={{
                                                            background: "var(--color-surface-2)",
                                                            border: "1px solid var(--color-hairline)",
                                                            borderRadius: 8,
                                                            padding: 8,
                                                            textAlign: "center",
                                                            fontSize: 12,
                                                            color: "var(--ink-2)",
                                                            marginTop: 12,
                                                        }}
                                                    >
                                                        Score: <span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{s.score != null ? `${s.score} / ${exam.maxPoints}` : "Pending"}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="k-card" style={{ padding: 14 }}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 500,
                                            color: "var(--ink-3)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                            marginBottom: 10,
                                        }}
                                    >
                                        Live activity
                                    </div>
                                    <div style={{ display: "grid", gap: 6, maxHeight: "58vh", overflowY: "auto" }}>
                                        {activity.length === 0 ? (
                                            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Waiting for activity…</div>
                                        ) : (
                                            activity.map((a) => (
                                                <div
                                                    key={a.id}
                                                    style={{
                                                        border: "1px solid var(--color-hairline)",
                                                        borderRadius: 8,
                                                        padding: "8px 10px",
                                                        background: "var(--color-surface)",
                                                    }}
                                                >
                                                    <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 400, lineHeight: 1.4 }}>{a.text}</div>
                                                    <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{a.at}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div
                    style={{
                        padding: "10px 22px",
                        background: "var(--color-surface)",
                        borderTop: "1px solid var(--color-hairline)",
                        display: "flex",
                        gap: 18,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-success)" }} />
                        <span style={{ color: "var(--ink-2)" }}>
                            Submitted: <span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{submittedCount}</span>
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink)" }} />
                        <span style={{ color: "var(--ink-2)" }}>
                            In progress: <span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{inProgressCount}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Warning Modal */}
            {showWarnModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(15,16,18,0.42)",
                        backdropFilter: "blur(2px)",
                        WebkitBackdropFilter: "blur(2px)",
                        padding: 16,
                    }}
                >
                    <div className="k-card" style={{ padding: 22, width: "100%", maxWidth: 420 }}>
                        <h3
                            style={{
                                fontSize: 16,
                                fontWeight: 500,
                                letterSpacing: "-0.014em",
                                color: "var(--ink)",
                                marginBottom: 4,
                            }}
                        >
                            Warn student
                        </h3>
                        <p
                            style={{
                                fontSize: 12.5,
                                color: "var(--ink-2)",
                                marginBottom: 14,
                                lineHeight: 1.5,
                            }}
                        >
                            Sending a warning to <span style={{ color: "var(--ink)", fontWeight: 500 }}>{showWarnModal.studentName}</span>
                        </p>
                        <textarea
                            value={warnMsg}
                            onChange={(e) => setWarnMsg(e.target.value)}
                            style={{
                                width: "100%",
                                height: 100,
                                borderRadius: 8,
                                border: "1px solid var(--color-hairline)",
                                background: "var(--color-surface)",
                                padding: 12,
                                fontSize: 13,
                                outline: "none",
                                marginBottom: 14,
                                resize: "none",
                                color: "var(--ink)",
                                fontFamily: "inherit",
                            }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                type="button"
                                onClick={() => setShowWarnModal(null)}
                                className="btn-kit btn-kit-ghost"
                                style={{ flex: 1, justifyContent: "center" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleControl(showWarnModal.attemptId, "warn")}
                                className="btn-kit btn-kit-warning"
                                style={{ flex: 1, justifyContent: "center" }}
                            >
                                Send warning
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {confirmEl}
        </div>
    );
}
