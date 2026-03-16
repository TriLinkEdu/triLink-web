"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useExamStore } from "@/store/examStore";

type QuestionType = "mcq" | "truefalse" | "fillin";

interface Question {
    id: number;
    type: QuestionType;
    text: string;
    options?: string[];
    order: number;
    correctAnswer?: string;
}

interface ExamData {
    id: number;
    course: string;
    type: string;
    title: string;
    duration: number;
    totalQuestions: number;
    questions: Question[];
}

function getMockExam(): ExamData {
    const questions: Question[] = [
        { id: 1, order: 1, type: "mcq", text: "What is the derivative of f(x) = 3x² + 2x - 5?", options: ["6x + 2", "3x + 2", "6x² + 2", "6x - 5"] },
        { id: 2, order: 2, type: "mcq", text: "Which of the following is NOT a property of limits?", options: ["Sum rule", "Product rule", "Division by zero rule", "Quotient rule"] },
        { id: 3, order: 3, type: "truefalse", text: "The integral of 1/x is ln|x| + C." },
        { id: 4, order: 4, type: "fillin", text: "The derivative of sin(x) is ______." },
        { id: 5, order: 5, type: "mcq", text: "What is the value of lim(x→0) sin(x)/x?", options: ["0", "1", "∞", "Does not exist"] },
        { id: 6, order: 6, type: "truefalse", text: "A continuous function on a closed interval always attains its maximum and minimum values." },
        { id: 7, order: 7, type: "mcq", text: "The chain rule states that d/dx[f(g(x))] equals:", options: ["f'(g(x)) · g'(x)", "f'(x) · g'(x)", "f(g'(x))", "f'(g(x))"] },
        { id: 8, order: 8, type: "fillin", text: "The formula for integration by parts is ∫u dv = uv - ∫______." },
        { id: 9, order: 9, type: "mcq", text: "Which test is used to determine if an infinite series converges?", options: ["Ratio test", "Mean test", "Mode test", "Range test"] },
        { id: 10, order: 10, type: "truefalse", text: "The second derivative test can determine concavity of a function." },
    ];
    return { id: 1, course: "Mathematics", type: "Midterm", title: "Ch.5-8 Midterm Exam", duration: 120, totalQuestions: questions.length, questions };
}

const STUDENT_EXAM_META: Record<number, { course: string; type: string; title: string; duration: number }> = {
    1: { course: "Mathematics", type: "Midterm", title: "Ch.5-8 Midterm Exam", duration: 120 },
    2: { course: "Physics", type: "Quiz", title: "Ch.6 Mechanics Quiz", duration: 30 },
    3: { course: "Chemistry", type: "Test", title: "Organic Chemistry Test", duration: 60 },
    4: { course: "English", type: "Quiz", title: "Grammar & Vocabulary Quiz", duration: 20 },
    5: { course: "Biology", type: "Test", title: "Cell Biology Test", duration: 45 },
    6: { course: "Mathematics", type: "Quiz", title: "Integration Quick Quiz", duration: 15 },
    7: { course: "Physics", type: "Final", title: "Semester Final Exam", duration: 180 },
};

function buildExamById(examId: number): ExamData {
    const base = getMockExam();
    const meta = STUDENT_EXAM_META[examId] ?? STUDENT_EXAM_META[1];
    return {
        ...base,
        id: examId,
        course: meta.course,
        type: meta.type,
        title: meta.title,
        duration: meta.duration,
    };
}

function buildPublishedExamById(examId: number, publishedExams: ReturnType<typeof useExamStore.getState>["publishedExams"]): ExamData | null {
    const published = publishedExams.find((e) => e.id === examId);
    if (!published) return null;

    return {
        id: published.id,
        course: published.course,
        type: published.type,
        title: published.title,
        duration: published.duration,
        totalQuestions: published.totalQuestions,
        questions: published.questions.map((q) => ({
            id: q.id,
            order: q.order,
            type: "mcq",
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
        })),
    };
}

export default function ExamSession() {
    const router = useRouter();
    const params = useParams<{ examId: string }>();
    const examId = Number(params?.examId ?? 1);
    const publishedExams = useExamStore(s => s.publishedExams);
    const safeExamId = Number.isNaN(examId) ? 1 : examId;
    const exam = buildPublishedExamById(safeExamId, publishedExams) ?? buildExamById(safeExamId);

    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [flagged, setFlagged] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [timeSpent, setTimeSpent] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showEarlyWarning, setShowEarlyWarning] = useState(false);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [tabViolations, setTabViolations] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const tabViolationsRef = useRef(0);
    const submittedRef = useRef(false);
    const { setResult, markExamCompleted } = useExamStore();

    const question = exam.questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const minimumTimeSeconds = Math.floor((exam.duration * 60) / 2);

    useEffect(() => {
        setTimeLeft(exam.duration * 60);
        setTimeSpent(0);
        setCurrentQ(0);
        setAnswers({});
        setFlagged(new Set());
        setSubmitted(false);
        setShowConfirm(false);
        setShowEarlyWarning(false);
        setShowReport(false);
        submittedRef.current = false;
    }, [exam.id, exam.duration]);

    useEffect(() => {
        if (submitted) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => { if (prev <= 1) { clearInterval(interval); setSubmitted(true); return 0; } return prev - 1; });
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted]);

    useEffect(() => {
        if (submitted) return;
        const handleVisibilityChange = () => { if (document.hidden) { tabViolationsRef.current += 1; setTabViolations(tabViolationsRef.current); setShowTabWarning(true); } };
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

    // Fullscreen enforcement — entering is attempted on mount; exiting counts as a violation
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

    // Save results to store and navigate to result page when exam is submitted
    useEffect(() => {
        if (!submitted) return;
        submittedRef.current = true;
        const fallbackCorrectAnswers: Record<number, string> = {
            1: "6x + 2", 2: "Division by zero rule", 3: "True", 4: "cos(x)",
            5: "1", 6: "True", 7: "f'(g(x)) \u00b7 g'(x)", 8: "v du",
            9: "Ratio test", 10: "True",
        };
        const score = Math.round((exam.questions.reduce((sum, q) => {
            const expected = (q.correctAnswer ?? fallbackCorrectAnswers[q.id] ?? "").trim();
            const actual = (answers[q.id] ?? "").trim();
            return sum + (expected && expected.toLowerCase() === actual.toLowerCase() ? 1 : 0);
        }, 0) / Math.max(1, exam.totalQuestions)) * 100);

        setResult({
            examId: exam.id,
            examTitle: exam.title,
            examCourse: exam.course,
            examType: exam.type,
            totalQuestions: exam.totalQuestions,
            timeSpent,
            tabViolations: tabViolationsRef.current,
            questions: exam.questions.map(q => ({
                id: q.id,
                order: q.order,
                type: q.type,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer ?? fallbackCorrectAnswers[q.id] ?? "",
                studentAnswer: answers[q.id] || "",
            })),
        });
        markExamCompleted({ examId: exam.id, score, completedAt: new Date().toISOString() });
        router.push(`/student/result/${exam.id}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted]);

    const setAnswer = (qId: number, value: string) => setAnswers(prev => ({ ...prev, [qId]: value }));
    const toggleFlag = (qId: number) => { setFlagged(prev => { const next = new Set(prev); next.has(qId) ? next.delete(qId) : next.add(qId); return next; }); };

    const handleSubmitClick = () => {
        if (timeSpent < minimumTimeSeconds) { setShowEarlyWarning(true); return; }
        setShowConfirm(true);
    };
    const confirmSubmit = () => {
        if (timeSpent < (exam.duration * 60 * 0.2) && answeredCount === exam.totalQuestions) { setShowConfirm(false); setShowReport(true); return; }
        setSubmitted(true); setShowConfirm(false);
    };
    const forceSubmitAfterReport = () => { setSubmitted(true); setShowReport(false); };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const timePercent = (timeLeft / (exam.duration * 60)) * 100;
    const isLowTime = timeLeft < 300;

    /* ─── EXAM UI ─── */
    return (
        <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", flexDirection: "column", userSelect: "none" }}>

            {/* Top Bar — responsive */}
            <div className="exam-topbar">
                <div className="exam-topbar-info">
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exam.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{exam.course} · {exam.type}</div>
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

            {/* Main Content — responsive flex → column on mobile */}
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

                {/* Navigator Sidebar — becomes bottom panel on mobile */}
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

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
    );
}
