"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    getExamQuestions,
    startExamAttempt,
    saveAttemptAnswers,
    submitAttempt as apiSubmitAttempt,
    recordViolation,
    listStudentExams,
    listEnrollments,
    getActiveAcademicYear,
    type ExamQuestionForStudent,
    type Exam,
} from "@/lib/admin-api";
import { chatRealtime } from "@/lib/chat-realtime";
import { getStoredUser } from "@/lib/auth";

type QuestionType = "mcq" | "truefalse" | "fillin";

interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options?: string[];
    order: number;
    imageUrl?: string;
}

interface ExamData {
    id: string;
    title: string;
    duration: number;
    minStayMinutes: number;
    totalQuestions: number;
    questions: Question[];
}

function normalizeQuestionType(rawType: string, options?: string[]): QuestionType {
    const t = rawType.trim().toLowerCase();
    if (
        t === "truefalse" ||
        t === "true_false" ||
        t === "true-false" ||
        t === "true/false" ||
        t === "boolean" ||
        t === "bool" ||
        (t.includes("true") && t.includes("false"))
    ) {
        return "truefalse";
    }
    if (t === "fillin" || t === "fill_in" || t === "fill-in" || t === "short_answer" || t === "shortanswer") {
        return "fillin";
    }
    if (t === "mcq" || t === "choose" || t === "multiple_choice" || t === "multiple-choice") {
        return "mcq";
    }

    // If type is ambiguous but options look like true/false, classify it as true/false.
    if (options && options.length === 2) {
        const vals = options.map((o) => o.trim().toLowerCase());
        if (vals.includes("true") && vals.includes("false")) return "truefalse";
    }

    return "mcq";
}

function parseQuestionOptions(raw: unknown): string[] | undefined {
    if (!raw) return undefined;

    try {
        let parsed: unknown = raw;
        // Handles nested stringified JSON payloads like '"[\"A\",\"B\"]"'.
        if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
            if (typeof parsed === "string") parsed = JSON.parse(parsed);
        }
        if (Array.isArray(parsed)) {
            return parsed.map((v) => String(v)).filter((v) => v.trim().length > 0);
        }
        if (parsed && typeof parsed === "object") {
            const obj = parsed as Record<string, unknown>;
            // Supports formats like { A: "...", B: "..." }.
            const ordered = [
                obj.A, obj.B, obj.C, obj.D,
                obj.a, obj.b, obj.c, obj.d,
                obj.optionA, obj.optionB, obj.optionC, obj.optionD,
                obj.option1, obj.option2, obj.option3, obj.option4,
            ]
                .filter((v) => typeof v === "string")
                .map((v) => String(v).trim())
                .filter((v) => v.length > 0);
            if (ordered.length > 0) return ordered;

            const values = Object.values(obj)
                .filter((v) => typeof v === "string")
                .map((v) => String(v).trim())
                .filter((v) => v.length > 0);
            if (values.length > 0) return values;
        }
    } catch {
        // Non-JSON string options fallback handled below.
    }

    if (typeof raw === "string" && raw.trim().length > 0) {
        return [raw.trim()];
    }

    return undefined;
}

function mapApiQuestions(raw: ExamQuestionForStudent[]): Question[] {
    const rows = [...raw].sort((a, b) => {
        const aIdx = typeof (a as any).orderIndex === "number" ? (a as any).orderIndex : Number.MAX_SAFE_INTEGER;
        const bIdx = typeof (b as any).orderIndex === "number" ? (b as any).orderIndex : Number.MAX_SAFE_INTEGER;
        return aIdx - bIdx;
    });

    return rows
        .map((item, i) => {
            const nested = (item as any).question ?? {};
            const stem = String(
                (item as any).stem ??
                nested.stem ??
                (item as any).text ??
                nested.text ??
                (item as any).questionText ??
                nested.questionText ??
                "",
            ).trim();
            const id = String((item as any).id ?? (item as any).questionId ?? nested.id ?? `q-${i}`);

            const rawOptions =
                (item as any).optionsJson ??
                nested.optionsJson ??
                (item as any).options ??
                nested.options ??
                (item as any).choices ??
                nested.choices;
            const options = parseQuestionOptions(rawOptions);
            const typeRaw = String(
                (item as any).type ??
                nested.type ??
                (item as any).questionType ??
                nested.questionType ??
                (item as any).kind ??
                nested.kind ??
                "mcq",
            );
            const qType = normalizeQuestionType(typeRaw, options);

            const safeOptions = qType === "truefalse"
                ? ["True", "False"]
                : options;

            // Extract image from attachmentsJson
            const rawAttachments = (item as any).attachmentsJson ?? nested.attachmentsJson;
            let imageUrl: string | undefined;
            if (rawAttachments) {
                try {
                    const atts = typeof rawAttachments === "string" ? JSON.parse(rawAttachments) : rawAttachments;
                    const img = Array.isArray(atts) ? atts.find((a: any) => a.kind === "image" || a.url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) : null;
                    if (img?.url) imageUrl = img.url;
                } catch { /* ignore */ }
            }

            return {
                id,
                type: qType,
                text: stem || `Question ${i + 1}`,
                options: safeOptions,
                order: i + 1,
                imageUrl,
            };
        })
        .filter((q) => q.text.trim().length > 0);
}

export default function ExamSession() {
    const router = useRouter();
    const params = useParams<{ examId: string }>();
    const examId = params?.examId ?? "";

    // ── Loading state ──
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const [exam, setExam] = useState<ExamData | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // ── Exam session state ──
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showEarlyWarning, setShowEarlyWarning] = useState(false);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [tabViolations, setTabViolations] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submittingNow, setSubmittingNow] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showTeacherWarning, setShowTeacherWarning] = useState(false);
    const [teacherWarningMsg, setTeacherWarningMsg] = useState("");
    const [sessionLocked, setSessionLocked] = useState(false);
    const tabViolationsRef = useRef(0);
    const submittedRef = useRef(false);
    const attemptIdRef = useRef<string | null>(null);
    const controlUnsubRef = useRef<null | (() => void)>(null);

    // ── Load exam from backend ──
    useEffect(() => {
        if (!examId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setLoadErr(null);
            setAccessDenied(false);
            try {
                // Get exam metadata
                const year = await getActiveAcademicYear();
                if (!year) throw new Error("No active academic year");
                const exams = await listStudentExams(year.id);

                const me = getStoredUser();
                let visibleExams = exams;
                if (me?.id) {
                    try {
                        const mine = await listEnrollments({ academicYearId: year.id, studentId: me.id });
                        const allowedOfferingIds = new Set(mine.map((e) => e.classOfferingId));
                        visibleExams = exams.filter((ex) => !ex.classOfferingId || allowedOfferingIds.has(ex.classOfferingId));
                    } catch {
                        // Do not block the page if enrollment endpoint is not available for the role.
                    }
                }

                const examMeta = visibleExams.find(e => e.id === examId);
                if (!examMeta) throw new Error("This exam is not assigned to your class.");

                const opensAtMs = new Date(examMeta.opensAt).getTime();
                const strictEndsAtMs = opensAtMs + examMeta.durationMinutes * 60_000;
                const nowMs = Date.now();
                if (nowMs < opensAtMs) {
                    throw new Error("This exam has not started yet.");
                }
                if (nowMs >= strictEndsAtMs) {
                    throw new Error("This exam time window has ended.");
                }

                // Get questions
                const rawQuestions = await getExamQuestions(examId);
                const questions = mapApiQuestions(rawQuestions);
                if (questions.length === 0) {
                    throw new Error("No questions are available for this exam yet.");
                }

                // Start attempt
                const attempt = await startExamAttempt(examId);
                if (cancelled) return;

                attemptIdRef.current = attempt.id;
                setAttemptId(attempt.id);

                // Store attemptId globally for violation reporting
                (window as unknown as Record<string, string>).__currentAttemptId = attempt.id;

                // Restore previous answers if any
                if (attempt.answersJson) {
                    try {
                        const prev = JSON.parse(attempt.answersJson);
                        if (typeof prev === "object" && prev !== null) setAnswers(prev);
                    } catch { /* ignore */ }
                }

        setExam({
                    id: examMeta.id,
                    title: examMeta.title,
                    duration: examMeta.durationMinutes,
                    minStayMinutes: Math.max(0, Math.min(examMeta.durationMinutes, examMeta.minStayMinutes ?? 0)),
                    totalQuestions: questions.length,
                    questions,
                });
                setTimeLeft(Math.max(0, Math.floor((strictEndsAtMs - nowMs) / 1000)));

                // Setup realtime listener for teacher control
                const currentUser = getStoredUser();
                if (currentUser && currentUser.id) {
                    chatRealtime.connect({ id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}` });
                }
                controlUnsubRef.current?.();
                const unsubControl = chatRealtime.on("attempt:control", (payload) => {
                    if (payload.attemptId !== attempt.id) return;
                    if (payload.action === "force_submit") {
                        setSubmitted(true);
                    } else if (payload.action === "warn") {
                        setTeacherWarningMsg(payload.message || "A teacher has sent you a warning.");
                        setShowTeacherWarning(true);
                    } else if (payload.action === "allow_rejoin") {
                        setTeacherWarningMsg(payload.message || "Teacher approved your rejoin request.");
                        setShowTeacherWarning(true);
                    }
                });
                controlUnsubRef.current = unsubControl;
            } catch (e) {
                if (!cancelled) {
                    const msg = e instanceof Error ? e.message : "Failed to load exam";
                    setLoadErr(msg);
                    setAccessDenied(msg.toLowerCase().includes("not assigned to your class"));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            controlUnsubRef.current?.();
            controlUnsubRef.current = null;
        };
    }, [examId, router]);

    const question = exam?.questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const minimumTimeSeconds = exam ? exam.minStayMinutes * 60 : 0;

    // ── Timer ──
    useEffect(() => {
        if (submitted || !exam) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(interval); setSubmitted(true); return 0; }
                return prev - 1;
            });
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted, exam]);

    // ── Auto-save answers every 15 seconds ──
    useEffect(() => {
        if (!attemptId || submitted) return;
        const interval = setInterval(() => {
            saveAttemptAnswers(attemptId, JSON.stringify(answers)).catch(() => {});
        }, 15000);
        return () => clearInterval(interval);
    }, [attemptId, answers, submitted]);

    // ── Tab switch / cheating prevention ──
    useEffect(() => {
        if (submitted) return;
        const handleVisibilityChange = () => {
            if (document.hidden) {
                tabViolationsRef.current += 1;
                setTabViolations(tabViolationsRef.current);
                setShowTabWarning(true);
                const aid = attemptIdRef.current;
                if (aid) {
                    recordViolation(aid, "Tab switch detected")
                        .then((res) => {
                            if (res.locked) {
                                setSessionLocked(true);
                                setLoadErr("Your exam session was locked due to tab switch. Wait for teacher approval to rejoin.");
                                setTimeout(() => router.push("/student/dashboard"), 900);
                            }
                        })
                        .catch(() => {});
                }
            }
        };
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "You are in an active exam session."; };
        const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && ["c", "v", "a", "x"].includes(e.key.toLowerCase())) e.preventDefault();
            if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i")) e.preventDefault();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [submitted, router]);

    // ── Fullscreen enforcement ──
    useEffect(() => {
        const enterFullscreen = () => {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        };
        enterFullscreen();
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !submittedRef.current) {
                tabViolationsRef.current += 1;
                setTabViolations(tabViolationsRef.current);
                setShowTabWarning(true);
                const aid = attemptIdRef.current;
                if (aid) {
                    recordViolation(aid, "Fullscreen exit detected")
                        .then((res) => {
                            if (res.locked) {
                                setSessionLocked(true);
                                setLoadErr("Your exam session was locked after leaving fullscreen. Wait for teacher approval to rejoin.");
                                setTimeout(() => router.push("/student/dashboard"), 900);
                            }
                        })
                        .catch(() => {});
                }
                setTimeout(enterFullscreen, 500);
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    // ── Submit ──
    useEffect(() => {
        if (!submitted || !attemptId) return;
        if (sessionLocked) return;
        submittedRef.current = true;
        setSubmittingNow(true);
        (async () => {
            let submittedOk = false;
            try {
                // Save final answers
                await saveAttemptAnswers(attemptId, JSON.stringify(answers));
                // Submit attempt
                await apiSubmitAttempt(attemptId);
                submittedOk = true;
            } catch (e) {
                setLoadErr(e instanceof Error ? e.message : "Failed to submit exam");
                submittedRef.current = false;
                setSubmitted(false);
                setSubmittingNow(false);
                return;
            }
            if (submittedOk) {
                router.push(`/student/result/${attemptId}`);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted, attemptId, answers, router, sessionLocked]);

    const setAnswer = (qId: string, value: string) => setAnswers(prev => ({ ...prev, [qId]: value }));
    const toggleFlag = (qId: string) => { setFlagged(prev => { const next = new Set(prev); next.has(qId) ? next.delete(qId) : next.add(qId); return next; }); };

    const handleSubmitClick = () => {
        if (submittingNow) return;
        if (minimumTimeSeconds > 0 && timeSpent < minimumTimeSeconds) { setShowEarlyWarning(true); return; }
        setShowConfirm(true);
    };
    const confirmSubmit = () => {
        if (exam && timeSpent < (exam.duration * 60 * 0.2) && answeredCount === exam.totalQuestions) { setShowConfirm(false); setShowReport(true); return; }
        setSubmitted(true); setShowConfirm(false);
    };
    const forceSubmitAfterReport = () => { setSubmitted(true); setShowReport(false); };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const timePercent = exam ? (timeLeft / (exam.duration * 60)) * 100 : 100;
    const isLowTime = timeLeft < 300;

    // ── Loading state ──
    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="spinner" style={{ width: 32, height: 32, border: "2px solid var(--color-hairline)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                    <p style={{ color: "var(--ink-3)", fontWeight: 500, fontSize: 12.5 }}>Initializing your exam session…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (loadErr || !exam || !question) {
        if (accessDenied) {
            return (
                <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div className="k-card" style={{ maxWidth: 480, width: "100%", padding: 28, textAlign: "center" }}>
                        <div style={{ width: 44, height: 44, margin: "0 auto 14px", borderRadius: 10, background: "var(--color-warning-soft)", color: "var(--color-warning)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 6 }}>Not assigned to your class</h2>
                        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 14 }}>
                            This exam is only available to students enrolled in its class.
                        </p>
                        <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 18 }}>
                            If you think this is a mistake, contact your teacher or school admin.
                        </p>
                        <button type="button" onClick={() => router.push("/student/dashboard")} className="btn-kit btn-kit-primary">
                            Back to dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div className="k-card" style={{ maxWidth: 460, width: "100%", padding: 28, textAlign: "center" }}>
                    <div style={{ width: 44, height: 44, margin: "0 auto 14px", borderRadius: 10, background: "var(--color-danger-soft)", color: "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 6 }}>Cannot start exam</h2>
                    <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 18, lineHeight: 1.55 }}>{loadErr || "Exam data is unavailable."}</p>
                    <button type="button" onClick={() => router.push("/student/dashboard")} className="btn-kit btn-kit-primary">
                        Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    /* ─── EXAM UI ─── */
    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column", userSelect: "none" }}>

            {/* Top Bar */}
            <div
                className="exam-topbar"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 20px",
                    background: "var(--color-surface)",
                    borderBottom: "1px solid var(--color-hairline)",
                }}
            >
                <div className="exam-topbar-info" style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
                        <span className="role-dot" />
                        Live exam
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 15, letterSpacing: "-0.012em", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exam.title}</div>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", borderRadius: 8,
                    background: isLowTime ? "var(--color-danger-soft)" : "var(--color-surface-2)",
                    border: `1px solid ${isLowTime ? "rgba(196,53,84,0.25)" : "var(--color-hairline)"}`,
                    color: isLowTime ? "var(--color-danger)" : "var(--ink)",
                    flexShrink: 0,
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span style={{
                        fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.01em",
                        animation: isLowTime ? "pulse 1s infinite" : "none",
                    }}>{formatTime(timeLeft)}</span>
                </div>
                <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={submittingNow}
                    className="btn-kit btn-kit-primary"
                    style={{ flexShrink: 0, opacity: submittingNow ? 0.7 : 1 }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                    {submittingNow ? "Submitting…" : "Submit"}
                </button>
            </div>

            {/* Progress Bar */}
            <div style={{ height: 2, background: "var(--color-hairline)" }}>
                <div style={{ height: "100%", background: isLowTime ? "var(--color-danger)" : "var(--ink)", width: `${timePercent}%`, transition: "width 1s linear" }} />
            </div>

            {/* Main Content */}
            <div className="exam-main-layout">

                {/* Question Panel */}
                <div className="exam-question-panel">
                    {/* Question Header */}
                    <div className="exam-question-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ink)", color: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 12, letterSpacing: "-0.01em" }}>{question.order}</span>
                            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>of {exam.totalQuestions}</span>
                            <span className="k-pill" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {question.type === "mcq" ? "Multiple choice" : question.type === "truefalse" ? "True / False" : "Fill in the blank"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleFlag(question.id)}
                            className={flagged.has(question.id) ? "btn-kit btn-kit-warning" : "btn-kit btn-kit-ghost"}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={flagged.has(question.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                            {flagged.has(question.id) ? "Flagged" : "Flag"}
                        </button>
                    </div>

                    {/* Question Text */}
                    <div className="k-card" style={{ padding: 20, marginBottom: 16 }}>
                        <p style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.005em" }}>{question.text}</p>
                        {question.imageUrl && (
                            <div style={{ marginTop: 12 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={question.imageUrl}
                                    alt="Question image"
                                    style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8, border: "1px solid var(--color-hairline)", display: "block" }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Answer Area */}
                    <div style={{ marginBottom: 24 }}>
                        {question.type === "mcq" && question.options?.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isSelected = answers[question.id] === opt;
                            return (
                                <label
                                    key={i}
                                    onClick={() => setAnswer(question.id, opt)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 14px", borderRadius: 10, marginBottom: 8,
                                        background: isSelected ? "var(--ink)" : "var(--color-surface)",
                                        border: `1px solid ${isSelected ? "var(--ink)" : "var(--color-hairline)"}`,
                                        color: isSelected ? "var(--color-bg)" : "var(--ink)",
                                        cursor: "pointer", transition: "all 120ms ease",
                                    }}
                                >
                                    <span style={{ width: 26, height: 26, borderRadius: 6, background: isSelected ? "var(--color-bg)" : "var(--color-surface-2)", color: isSelected ? "var(--ink)" : "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 12, flexShrink: 0, border: isSelected ? "none" : "1px solid var(--color-hairline)" }}>{letter}</span>
                                    <span style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.4 }}>{opt}</span>
                                    {isSelected && <span style={{ marginLeft: "auto", display: "flex" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>}
                                </label>
                            );
                        })}
                        {question.type === "mcq" && (!question.options || question.options.length === 0) && (
                            <div style={{ borderRadius: 8, border: "1px solid rgba(196,53,84,0.18)", background: "var(--color-warning-soft)", padding: "10px 12px", color: "var(--color-warning)", fontSize: 12.5, fontWeight: 500 }}>
                                Options are missing for this question. Please notify your teacher to republish the exam question options.
                            </div>
                        )}
                        {question.type === "truefalse" && (
                            <div style={{ display: "flex", gap: 10 }}>
                                {["True", "False"].map(opt => {
                                    const isSelected = answers[question.id] === opt;
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setAnswer(question.id, opt)}
                                            style={{
                                                flex: 1, padding: "16px", borderRadius: 10,
                                                background: isSelected ? "var(--ink)" : "var(--color-surface)",
                                                border: `1px solid ${isSelected ? "var(--ink)" : "var(--color-hairline)"}`,
                                                cursor: "pointer", fontSize: 15, fontWeight: 500,
                                                color: isSelected ? "var(--color-bg)" : "var(--ink)",
                                                letterSpacing: "-0.01em",
                                                transition: "all 120ms ease",
                                            }}
                                        >
                                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                                {opt === "True" ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                )}
                                                {opt}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {question.type === "fillin" && (
                            <input
                                type="text"
                                value={answers[question.id] || ""}
                                onChange={(e) => setAnswer(question.id, e.target.value)}
                                placeholder="Type your answer here…"
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    borderRadius: 8,
                                    border: "1px solid var(--color-hairline)",
                                    fontSize: 14,
                                    background: "var(--color-surface)",
                                    color: "var(--ink)",
                                    outline: "none",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "var(--ink)")}
                                onBlur={(e) => (e.target.style.borderColor = "var(--color-hairline)")}
                            />
                        )}
                    </div>

                    {/* Nav Buttons */}
                    <div className="exam-nav-buttons" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <button
                            type="button"
                            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                            disabled={currentQ === 0}
                            className="btn-kit btn-kit-ghost"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                            Prev
                        </button>
                        <span style={{ fontSize: 12, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>Q {currentQ + 1} of {exam.totalQuestions}</span>
                        <button
                            type="button"
                            onClick={() => setCurrentQ(Math.min(exam.totalQuestions - 1, currentQ + 1))}
                            disabled={currentQ === exam.totalQuestions - 1}
                            className="btn-kit btn-kit-primary"
                        >
                            Next
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                </div>

                {/* Navigator Sidebar */}
                <div className="exam-navigator-sidebar">
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>Question navigator</div>
                    <div className="nav-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 20 }}>
                        {exam.questions.map((q, i) => {
                            const isAnswered = answers[q.id] !== undefined;
                            const isFlagged = flagged.has(q.id);
                            const isCurrent = i === currentQ;
                            return (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => setCurrentQ(i)}
                                    style={{
                                        width: 36, height: 36, borderRadius: 8,
                                        border: `1px solid ${isCurrent ? "var(--ink)" : isFlagged ? "rgba(196,53,84,0.25)" : isAnswered ? "rgba(13,138,95,0.22)" : "var(--color-hairline)"}`,
                                        background: isCurrent ? "var(--ink)" : isFlagged ? "var(--color-warning-soft)" : isAnswered ? "var(--color-success-soft)" : "var(--color-surface)",
                                        color: isCurrent ? "var(--color-bg)" : isFlagged ? "var(--color-warning)" : isAnswered ? "var(--color-success)" : "var(--ink-2)",
                                        fontWeight: 500, fontSize: 12, cursor: "pointer", position: "relative" as const,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {q.order}
                                    {isFlagged && (
                                        <span style={{ position: "absolute" as const, top: -3, right: -3, color: "var(--color-warning)" }}>
                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-success-soft)", border: "1px solid rgba(13,138,95,0.22)", display: "inline-block" }} />
                            Answered ({answeredCount})
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-surface)", border: "1px solid var(--color-hairline)", display: "inline-block" }} />
                            Unanswered ({exam.totalQuestions - answeredCount})
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-warning-soft)", border: "1px solid rgba(196,53,84,0.25)", display: "inline-block" }} />
                            Flagged ({flagged.size})
                        </div>
                    </div>
                    <div className="k-card" style={{ padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)" }}>Progress</div>
                        <div style={{ height: 4, background: "var(--color-hairline)", borderRadius: 2, marginBottom: 8 }}>
                            <div style={{ height: "100%", background: "var(--ink)", borderRadius: 2, width: `${(answeredCount / exam.totalQuestions) * 100}%`, transition: "width 200ms ease" }} />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>{answeredCount} of {exam.totalQuestions} answered</div>
                    </div>
                </div>
            </div>

            {/* MODALS — kit-styled */}
            {showConfirm && (
                <KitExamDialog
                    tone="default"
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /></svg>
                    }
                    title="Submit exam?"
                    description="Are you sure you want to submit your answers?"
                >
                    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-hairline)", borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontSize: 12.5, color: "var(--ink-2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Answered</span><span style={{ color: "var(--ink)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{answeredCount}/{exam.totalQuestions}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Unanswered</span><span style={{ color: "var(--color-danger)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{exam.totalQuestions - answeredCount}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Flagged</span><span style={{ color: "var(--color-warning)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{flagged.size}</span></div>
                    </div>
                    {exam.totalQuestions - answeredCount > 0 && (
                        <div style={{ background: "var(--color-warning-soft)", border: "1px solid rgba(196,53,84,0.18)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, color: "var(--color-warning)", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            {exam.totalQuestions - answeredCount} question(s) still unanswered
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" disabled={submittingNow} onClick={() => setShowConfirm(false)} className="btn-kit btn-kit-ghost" style={{ flex: 1, justifyContent: "center" }}>Go back</button>
                        <button type="button" disabled={submittingNow} onClick={confirmSubmit} className="btn-kit btn-kit-primary" style={{ flex: 1, justifyContent: "center", opacity: submittingNow ? 0.75 : 1 }}>{submittingNow ? "Submitting…" : "Yes, submit"}</button>
                    </div>
                </KitExamDialog>
            )}
            {showEarlyWarning && (
                <KitExamDialog
                    tone="danger"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></svg>}
                    title="Cannot submit yet"
                    description={<>You must remain in the exam for at least <strong>{formatTime(minimumTimeSeconds)}</strong>.</>}
                >
                    <div style={{ background: "var(--color-danger-soft)", border: "1px solid rgba(196,53,84,0.18)", borderRadius: 8, padding: "12px 14px", marginBottom: 14, color: "var(--color-danger)", fontSize: 12.5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Time spent</span><span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatTime(timeSpent)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Minimum</span><span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatTime(minimumTimeSeconds)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Remaining</span><span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatTime(Math.max(0, minimumTimeSeconds - timeSpent))}</span></div>
                    </div>
                    <button type="button" onClick={() => setShowEarlyWarning(false)} className="btn-kit btn-kit-primary" style={{ width: "100%", justifyContent: "center" }}>OK, continue exam</button>
                </KitExamDialog>
            )}
            {showTabWarning && (
                <KitExamDialog
                    tone="danger"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                    title="Tab switch detected"
                    description="You left the exam tab. This has been recorded. Excessive tab switching may result in disqualification."
                >
                    <div style={{ background: "var(--color-danger-soft)", border: "1px solid rgba(196,53,84,0.18)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "var(--color-danger)", fontWeight: 500, fontSize: 13, textAlign: "center" }}>
                        Total violations: <span style={{ fontVariantNumeric: "tabular-nums" }}>{tabViolations} / 3</span>
                    </div>
                    {tabViolations >= 3 ? (
                        <button type="button" onClick={() => { setShowTabWarning(false); setSubmitted(true); }} className="btn-kit btn-kit-danger" style={{ width: "100%", justifyContent: "center" }}>Exam auto-submitted</button>
                    ) : (
                        <button type="button" onClick={() => setShowTabWarning(false)} className="btn-kit btn-kit-primary" style={{ width: "100%", justifyContent: "center" }}>Return to exam</button>
                    )}
                </KitExamDialog>
            )}
            {showReport && (
                <KitExamDialog
                    tone="warning"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
                    title="Suspiciously fast"
                    description={<>Completed in <strong>{formatTime(timeSpent)}</strong>. This has been flagged for review.</>}
                >
                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setShowReport(false)} className="btn-kit btn-kit-primary" style={{ flex: 1, justifyContent: "center" }}>Go back & review</button>
                        <button type="button" disabled={submittingNow} onClick={forceSubmitAfterReport} className="btn-kit btn-kit-ghost" style={{ flex: 1, justifyContent: "center", opacity: submittingNow ? 0.6 : 1 }}>{submittingNow ? "Submitting…" : "Submit anyway"}</button>
                    </div>
                </KitExamDialog>
            )}

            {showTeacherWarning && (
                <KitExamDialog
                    tone="danger"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
                    title="Teacher warning"
                    description="Your instructor sent you the following message:"
                >
                    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-hairline)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
                        <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 400, lineHeight: 1.55, fontStyle: "italic" }}>
                            &ldquo;{teacherWarningMsg}&rdquo;
                        </p>
                    </div>
                    <button type="button" onClick={() => setShowTeacherWarning(false)} className="btn-kit btn-kit-primary" style={{ width: "100%", justifyContent: "center" }}>
                        I understand, return to exam
                    </button>
                </KitExamDialog>
            )}

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>
        </div>
    );
}

// ---------- Local kit-styled dialog for the live exam surface ----------
function KitExamDialog({
    tone = "default",
    icon,
    title,
    description,
    children,
}: {
    tone?: "default" | "warning" | "danger";
    icon: React.ReactNode;
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneBg =
        tone === "danger"
            ? "var(--color-danger-soft)"
            : tone === "warning"
                ? "var(--color-warning-soft)"
                : "var(--color-surface-2)";
    const toneFg =
        tone === "danger"
            ? "var(--color-danger)"
            : tone === "warning"
                ? "var(--color-warning)"
                : "var(--ink)";
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,8,9,0.42)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
            }}
        >
            <div
                className="k-card"
                style={{
                    maxWidth: 420,
                    width: "100%",
                    padding: 24,
                    background: "var(--color-surface)",
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: toneBg,
                        color: toneFg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 14,
                    }}
                >
                    {icon}
                </div>
                <h2
                    style={{
                        fontSize: 17,
                        fontWeight: 500,
                        letterSpacing: "-0.018em",
                        color: "var(--ink)",
                        marginBottom: description ? 4 : 14,
                    }}
                >
                    {title}
                </h2>
                {description ? (
                    <p
                        style={{
                            color: "var(--ink-2)",
                            marginBottom: 14,
                            fontSize: 13,
                            lineHeight: 1.55,
                        }}
                    >
                        {description}
                    </p>
                ) : null}
                {children}
            </div>
        </div>
    );
}
