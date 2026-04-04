"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    getExamQuestions,
    startExamAttempt,
    saveAttemptAnswers,
    submitAttempt as apiSubmitAttempt,
    recordViolation,
    listExams,
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
}

interface ExamData {
    id: string;
    title: string;
    duration: number;
    totalQuestions: number;
    questions: Question[];
}

function mapApiQuestions(raw: ExamQuestionForStudent[]): Question[] {
    return raw
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((q, i) => {
            let options: string[] | undefined;
            if (q.optionsJson) {
                try { options = JSON.parse(q.optionsJson); } catch { options = undefined; }
            }
            let type: QuestionType = "fillin";
            if (q.type === "mcq" && options && options.length > 0) type = "mcq";
            else if (q.type === "truefalse") type = "truefalse";
            return { id: q.id, type, text: q.stem, options, order: i + 1 };
        });
}

export default function ExamSession() {
    const router = useRouter();
    const params = useParams<{ examId: string }>();
    const examId = params?.examId ?? "";

    // ── Loading state ──
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState<string | null>(null);
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
    const [showReport, setShowReport] = useState(false);
    const [showTeacherWarning, setShowTeacherWarning] = useState(false);
    const [teacherWarningMsg, setTeacherWarningMsg] = useState("");
    const tabViolationsRef = useRef(0);
    const submittedRef = useRef(false);
    const attemptIdRef = useRef<string | null>(null);

    // ── Load exam from backend ──
    useEffect(() => {
        if (!examId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setLoadErr(null);
            try {
                // Get exam metadata
                const year = await getActiveAcademicYear();
                if (!year) throw new Error("No active academic year");
                const exams = await listExams(year.id);
                const examMeta = exams.find(e => e.id === examId);
                if (!examMeta) throw new Error("Exam not found");

                // Get questions
                const rawQuestions = await getExamQuestions(examId);
                const questions = mapApiQuestions(rawQuestions);

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
                    totalQuestions: questions.length,
                    questions,
                });
                setTimeLeft(examMeta.durationMinutes * 60);

                // Setup realtime listener for teacher control
                const me = getStoredUser();
                if (me && me.id) {
                    chatRealtime.connect({ id: me.id, name: `${me.firstName} ${me.lastName}` });
                }
                const unsubControl = chatRealtime.on("attempt:control", (payload) => {
                    if (payload.attemptId !== attempt.id) return;
                    if (payload.action === "force_submit") {
                        setSubmitted(true);
                    } else if (payload.action === "warn") {
                        setTeacherWarningMsg(payload.message || "A teacher has sent you a warning.");
                        setShowTeacherWarning(true);
                    }
                });
                return () => {
                    cancelled = true;
                    unsubControl();
                };
            } catch (e) {
                if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Failed to load exam");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [examId, router]);

    const question = exam?.questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const minimumTimeSeconds = exam ? Math.floor((exam.duration * 60) / 2) : 0;

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
                    recordViolation(aid, JSON.stringify({ type: "tab_switch", reason: "Document visibility changed to hidden", timestamp: new Date().toISOString() })).catch(() => {});
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
    }, [submitted]);

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
                    recordViolation(aid, JSON.stringify({ type: "fullscreen_exit", reason: "Student exited fullscreen mode", timestamp: new Date().toISOString() })).catch(() => {});
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
        submittedRef.current = true;
        (async () => {
            try {
                // Save final answers
                await saveAttemptAnswers(attemptId, JSON.stringify(answers));
                // Submit attempt
                await apiSubmitAttempt(attemptId);
            } catch { /* best-effort */ }
            router.push(`/student/result/${attemptId}`);
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted]);

    const setAnswer = (qId: string, value: string) => setAnswers(prev => ({ ...prev, [qId]: value }));
    const toggleFlag = (qId: string) => { setFlagged(prev => { const next = new Set(prev); next.has(qId) ? next.delete(qId) : next.add(qId); return next; }); };

    const handleSubmitClick = () => {
        if (timeSpent < minimumTimeSeconds) { setShowEarlyWarning(true); return; }
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

    // ── Loading / Error states ──
    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "var(--gray-500)" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Loading Exam…</div>
                    <p style={{ fontSize: "0.9rem" }}>Please wait while we prepare your exam session.</p>
                </div>
            </div>
        );
    }

    if (loadErr || !exam || !question) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "var(--danger)", maxWidth: 400 }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Cannot Start Exam</div>
                    <p style={{ fontSize: "0.9rem", color: "var(--gray-600)" }}>{loadErr || "Exam data is unavailable."}</p>
                    <button onClick={() => router.push("/student/dashboard")} style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", borderRadius: 12, background: "var(--primary-500)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    /* ─── EXAM UI ─── */
    return (
        <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", flexDirection: "column", userSelect: "none" }}>

            {/* Top Bar */}
            <div className="exam-topbar">
                <div className="exam-topbar-info">
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exam.title}</div>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.5rem 1.25rem", borderRadius: 12,
                    background: isLowTime ? "var(--danger-light)" : "var(--gray-50)",
                    border: `1.5px solid ${isLowTime ? "var(--danger)" : "var(--gray-200)"}`,
                    flexShrink: 0,
                }}>
                    <span style={{ color: isLowTime ? "#991b1b" : "var(--gray-500)", display: "flex" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></span>
                    <span style={{
                        fontSize: "1.25rem", fontWeight: 800, fontVariantNumeric: "tabular-nums",
                        color: isLowTime ? "var(--danger)" : "var(--gray-900)",
                        animation: isLowTime ? "pulse 1s infinite" : "none",
                    }}>{formatTime(timeLeft)}</span>
                </div>
                <button onClick={handleSubmitClick} style={{
                    padding: "0.6rem 1.25rem", borderRadius: 10,
                    background: "linear-gradient(135deg, var(--success), #059669)",
                    color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                    border: "none", cursor: "pointer", flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg> Submit</button>
            </div>

            {/* Progress Bar */}
            <div style={{ height: 4, background: "var(--gray-100)" }}>
                <div style={{ height: "100%", background: isLowTime ? "var(--danger)" : "var(--primary-500)", width: `${timePercent}%`, transition: "width 1s linear" }} />
            </div>

            {/* Main Content */}
            <div className="exam-main-layout">

                {/* Question Panel */}
                <div className="exam-question-panel">
                    {/* Question Header */}
                    <div className="exam-question-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>{question.order}</span>
                            <span style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>of {exam.totalQuestions}</span>
                            <span style={{
                                padding: "0.3rem 0.75rem", borderRadius: 8,
                                background: question.type === "mcq" ? "var(--primary-50)" : question.type === "truefalse" ? "var(--purple-light)" : "var(--warning-light)",
                                color: question.type === "mcq" ? "var(--primary-600)" : question.type === "truefalse" ? "#5b21b6" : "#92400e",
                                fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" as const,
                            }}>
                                {question.type === "mcq" ? "Multiple Choice" : question.type === "truefalse" ? "True / False" : "Fill in the Blank"}
                            </span>
                        </div>
                        <button onClick={() => toggleFlag(question.id)} style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            padding: "0.5rem 1rem", borderRadius: 10,
                            background: flagged.has(question.id) ? "var(--warning-light)" : "var(--gray-50)",
                            border: `1.5px solid ${flagged.has(question.id) ? "var(--warning)" : "var(--gray-200)"}`,
                            color: flagged.has(question.id) ? "#92400e" : "var(--gray-600)",
                            fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={flagged.has(question.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg> {flagged.has(question.id) ? "Flagged" : "Flag"}
                        </button>
                    </div>

                    {/* Question Text */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid var(--gray-100)", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, fontWeight: 500, color: "var(--gray-800)" }}>{question.text}</p>
                    </div>

                    {/* Answer Area */}
                    <div style={{ marginBottom: "2rem" }}>
                        {question.type === "mcq" && question.options?.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isSelected = answers[question.id] === opt;
                            return (
                                <label key={i} onClick={() => setAnswer(question.id, opt)} style={{
                                    display: "flex", alignItems: "center", gap: "1rem",
                                    padding: "1rem 1.25rem", borderRadius: 14, marginBottom: "0.5rem",
                                    background: isSelected ? "var(--primary-50)" : "#fff",
                                    border: `2px solid ${isSelected ? "var(--primary-500)" : "var(--gray-200)"}`,
                                    cursor: "pointer", transition: "all 150ms ease",
                                }}>
                                    <span style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? "var(--primary-500)" : "var(--gray-100)", color: isSelected ? "#fff" : "var(--gray-600)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>{letter}</span>
                                    <span style={{ fontSize: "0.95rem", fontWeight: isSelected ? 600 : 400, color: "var(--gray-800)" }}>{opt}</span>
                                    {isSelected && <span style={{ marginLeft: "auto", color: "var(--primary-500)", display: "flex" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>}
                                </label>
                            );
                        })}
                        {question.type === "truefalse" && (
                            <div style={{ display: "flex", gap: "1rem" }}>
                                {["True", "False"].map(opt => {
                                    const isSelected = answers[question.id] === opt;
                                    return (
                                        <button key={opt} onClick={() => setAnswer(question.id, opt)} style={{
                                            flex: 1, padding: "1.25rem", borderRadius: 14,
                                            background: isSelected ? (opt === "True" ? "var(--success-light)" : "var(--danger-light)") : "#fff",
                                            border: `2px solid ${isSelected ? (opt === "True" ? "var(--success)" : "var(--danger)") : "var(--gray-200)"}`,
                                            cursor: "pointer", fontSize: "1rem", fontWeight: 700,
                                            color: isSelected ? (opt === "True" ? "#065f46" : "#991b1b") : "var(--gray-700)",
                                        }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>{opt === "True" ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> True</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> False</>}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {question.type === "fillin" && (
                            <input type="text" value={answers[question.id] || ""} onChange={(e) => setAnswer(question.id, e.target.value)}
                                placeholder="Type your answer here..."
                                style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 14, border: "2px solid var(--gray-200)", fontSize: "1rem", background: "#fff", outline: "none" }}
                                onFocus={(e) => e.target.style.borderColor = "var(--primary-500)"}
                                onBlur={(e) => e.target.style.borderColor = "var(--gray-200)"} />
                        )}
                    </div>

                    {/* Nav Buttons */}
                    <div className="exam-nav-buttons">
                        <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} style={{
                            padding: "0.65rem 1.5rem", borderRadius: 10, background: currentQ === 0 ? "var(--gray-100)" : "#fff",
                            border: "1.5px solid var(--gray-200)", color: currentQ === 0 ? "var(--gray-300)" : "var(--gray-700)",
                            fontWeight: 600, fontSize: "0.85rem", cursor: currentQ === 0 ? "not-allowed" : "pointer",
                        }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> Prev</button>
                        <span style={{ fontSize: "0.85rem", color: "var(--gray-400)" }}>Q {currentQ + 1} of {exam.totalQuestions}</span>
                        <button onClick={() => setCurrentQ(Math.min(exam.totalQuestions - 1, currentQ + 1))} disabled={currentQ === exam.totalQuestions - 1} style={{
                            padding: "0.65rem 1.5rem", borderRadius: 10,
                            background: currentQ === exam.totalQuestions - 1 ? "var(--gray-100)" : "var(--primary-500)",
                            border: "none", color: currentQ === exam.totalQuestions - 1 ? "var(--gray-300)" : "#fff",
                            fontWeight: 600, fontSize: "0.85rem", cursor: currentQ === exam.totalQuestions - 1 ? "not-allowed" : "pointer",
                        }}>Next <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>
                    </div>
                </div>

                {/* Navigator Sidebar */}
                <div className="exam-navigator-sidebar">
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-700)", marginBottom: "1rem" }}>Question Navigator</div>
                    <div className="nav-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: "1.5rem" }}>
                        {exam.questions.map((q, i) => {
                            const isAnswered = answers[q.id] !== undefined;
                            const isFlagged = flagged.has(q.id);
                            const isCurrent = i === currentQ;
                            return (
                                <button key={q.id} onClick={() => setCurrentQ(i)} style={{
                                    width: 38, height: 38, borderRadius: 10, border: "none",
                                    background: isCurrent ? "var(--primary-500)" : isFlagged ? "var(--warning-light)" : isAnswered ? "var(--success-light)" : "var(--gray-100)",
                                    color: isCurrent ? "#fff" : isFlagged ? "#92400e" : isAnswered ? "#065f46" : "var(--gray-500)",
                                    fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", position: "relative" as const,
                                    boxShadow: isCurrent ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                                }}>
                                    {q.order}
                                    {isFlagged && <span style={{ position: "absolute" as const, top: -4, right: -4, color: "#92400e" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg></span>}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "flex", flexDirection: "column" as const, gap: "0.5rem", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--success-light)", border: "1px solid #d1fae5", display: "inline-block" }} /> Answered ({answeredCount})</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--gray-100)", display: "inline-block" }} /> Unanswered ({exam.totalQuestions - answeredCount})</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--warning-light)", border: "1px solid #fef3c7", display: "inline-block" }} /> Flagged ({flagged.size})</div>
                    </div>
                    <div style={{ padding: "1rem", borderRadius: 12, background: "var(--gray-50)", border: "1px solid var(--gray-200)", fontSize: "0.8rem" }}>
                        <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Progress</div>
                        <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 3, marginBottom: "0.5rem" }}>
                            <div style={{ height: "100%", background: "var(--success)", borderRadius: 3, width: `${(answeredCount / exam.totalQuestions) * 100}%`, transition: "width 200ms ease" }} />
                        </div>
                        <div style={{ color: "var(--gray-500)" }}>{answeredCount} of {exam.totalQuestions} answered</div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showConfirm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", maxWidth: 420, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--primary-500)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /></svg></div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Submit Exam?</h2>
                        <p style={{ color: "var(--gray-500)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>Are you sure you want to submit?</p>
                        <div style={{ background: "var(--gray-50)", borderRadius: 12, padding: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                            <div>Answered: <strong>{answeredCount}/{exam.totalQuestions}</strong></div>
                            <div>Unanswered: <strong style={{ color: "var(--danger)" }}>{exam.totalQuestions - answeredCount}</strong></div>
                            <div>Flagged: <strong style={{ color: "var(--warning)" }}>{flagged.size}</strong></div>
                        </div>
                        {exam.totalQuestions - answeredCount > 0 && (
                            <div style={{ background: "var(--warning-light)", borderRadius: 10, padding: "0.75rem", marginBottom: "1rem", color: "#92400e", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> You have {exam.totalQuestions - answeredCount} unanswered question(s)!
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "var(--gray-100)", border: "none", fontWeight: 600, cursor: "pointer", color: "var(--gray-700)" }}>Go Back</button>
                            <button onClick={confirmSubmit} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "var(--success)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff" }}>Yes, Submit</button>
                        </div>
                    </div>
                </div>
            )}
            {showEarlyWarning && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", maxWidth: 420, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--danger)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></svg></div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--danger)" }}>Cannot Submit Yet</h2>
                        <p style={{ color: "var(--gray-600)", marginBottom: "1rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            You must remain for at least <strong>{formatTime(minimumTimeSeconds)}</strong>.
                        </p>
                        <div style={{ background: "var(--danger-light)", borderRadius: 12, padding: "1rem", marginBottom: "1.5rem", color: "#991b1b", fontSize: "0.85rem" }}>
                            <div>Time spent: <strong>{formatTime(timeSpent)}</strong></div>
                            <div>Minimum: <strong>{formatTime(minimumTimeSeconds)}</strong></div>
                            <div>Remaining: <strong>{formatTime(Math.max(0, minimumTimeSeconds - timeSpent))}</strong></div>
                        </div>
                        <button onClick={() => setShowEarlyWarning(false)} style={{ padding: "0.75rem 2rem", borderRadius: 12, background: "var(--primary-500)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff" }}>OK, Continue Exam</button>
                    </div>
                </div>
            )}
            {showTabWarning && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", maxWidth: 420, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--danger)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--danger)" }}>Tab Switch Detected!</h2>
                        <p style={{ color: "var(--gray-600)", marginBottom: "1rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            You left the exam tab. This has been recorded. Excessive tab switching may result in disqualification.
                        </p>
                        <div style={{ background: "var(--danger-light)", borderRadius: 12, padding: "0.75rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 700, fontSize: "0.9rem" }}>
                            Total violations: {tabViolations} / 3
                        </div>
                        {tabViolations >= 3 ? (
                            <button onClick={() => { setShowTabWarning(false); setSubmitted(true); }} style={{ padding: "0.75rem 2rem", borderRadius: 12, background: "var(--danger)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff", width: "100%" }}>Exam Auto-Submitted</button>
                        ) : (
                            <button onClick={() => setShowTabWarning(false)} style={{ padding: "0.75rem 2rem", borderRadius: 12, background: "var(--primary-500)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff", width: "100%" }}>Return to Exam</button>
                        )}
                    </div>
                </div>
            )}
            {showReport && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", maxWidth: 420, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--warning-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--warning)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--warning)" }}>Suspiciously Fast</h2>
                        <p style={{ color: "var(--gray-600)", marginBottom: "1rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            Completed in <strong>{formatTime(timeSpent)}</strong>. This has been flagged for review.
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => setShowReport(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "var(--primary-500)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff" }}>Go Back & Review</button>
                            <button onClick={forceSubmitAfterReport} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "var(--gray-100)", border: "none", fontWeight: 600, cursor: "pointer", color: "var(--gray-700)" }}>Submit Anyway</button>
                        </div>
                    </div>
                </div>
            )}

            {showTeacherWarning && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 24, padding: "2.5rem", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: "var(--danger)" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.75rem", color: "var(--danger)" }}>Teacher Warning</h2>
                        <div style={{ background: "var(--gray-50)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem", border: "1px solid var(--gray-200)" }}>
                            <p style={{ color: "var(--gray-800)", fontSize: "1rem", fontWeight: 600, lineHeight: 1.6 }}>
                                "{teacherWarningMsg}"
                            </p>
                        </div>
                        <button onClick={() => setShowTeacherWarning(false)} style={{ 
                            padding: "1rem 2.5rem", borderRadius: 14, background: "var(--primary-500)", 
                            border: "none", fontWeight: 800, cursor: "pointer", color: "#fff", width: "100%",
                            fontSize: "1rem", boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                        }}>
                            I Understand, Return to Exam
                        </button>
                    </div>
                </div>
            )}

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
    );
}
