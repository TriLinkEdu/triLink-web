"use client";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";

type QuestionType = "mcq" | "truefalse" | "fillin";

interface Question {
    id: number;
    order: number;
    type: QuestionType;
    text: string;
    options?: string[];
    correctAnswer: string;
    studentAnswer: string;
}

export default function ExamResult({ params }: { params: Promise<{ examId: string }> }) {
    const router = useRouter();
    const storeResult = useExamStore(s => s.result);
    const teacherGrades = useExamStore(s => s.teacherGrades);

    // Fallback shown when navigating directly to the URL without a live session
    const fallbackQuestions: { id: number; order: number; type: QuestionType; text: string; options?: string[]; correctAnswer: string; studentAnswer: string }[] = [
        { id: 1, order: 1, type: "mcq", text: "Which of the following is a conjunction?", options: ["Run", "But", "Quickly", "Chair"], correctAnswer: "But", studentAnswer: "But" },
        { id: 2, order: 2, type: "truefalse", text: "'Their' is a possessive pronoun.", correctAnswer: "True", studentAnswer: "True" },
        { id: 3, order: 3, type: "fillin", text: "The past tense of 'go' is ______.", correctAnswer: "went", studentAnswer: "went" },
        { id: 4, order: 4, type: "mcq", text: "What type of sentence is 'Close the door!'?", options: ["Declarative", "Interrogative", "Imperative", "Exclamatory"], correctAnswer: "Imperative", studentAnswer: "Imperative" },
        { id: 5, order: 5, type: "truefalse", text: "An adverb modifies a noun.", correctAnswer: "False", studentAnswer: "False" },
        { id: 6, order: 6, type: "mcq", text: "Which word is a synonym for 'happy'?", options: ["Sad", "Angry", "Joyful", "Tired"], correctAnswer: "Joyful", studentAnswer: "Joyful" },
        { id: 7, order: 7, type: "fillin", text: "The plural of 'child' is ______.", correctAnswer: "children", studentAnswer: "children" },
        { id: 8, order: 8, type: "mcq", text: "What is the subject in 'The cat sat on the mat'?", options: ["cat", "sat", "mat", "on"], correctAnswer: "cat", studentAnswer: "mat" },
        { id: 9, order: 9, type: "truefalse", text: "A compound sentence has two independent clauses.", correctAnswer: "True", studentAnswer: "True" },
        { id: 10, order: 10, type: "mcq", text: "Which is a preposition?", options: ["Under", "Beautiful", "Quickly", "Speak"], correctAnswer: "Under", studentAnswer: "" },
    ];

    const data = storeResult ?? {
        examId: 0,
        examTitle: "Grammar & Vocabulary Quiz",
        examCourse: "English",
        examType: "Quiz",
        totalQuestions: 10,
        timeSpent: 872,
        tabViolations: 0,
        questions: fallbackQuestions,
    };

    const teacherFeedback = teacherGrades.find(g => g.quizTitle === data.examTitle);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const correct = data.questions.filter(q => q.studentAnswer && q.studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length;
    const unanswered = data.questions.filter(q => !q.studentAnswer).length;
    const wrong = data.totalQuestions - correct - unanswered;
    const scoreVal = Math.round((correct / data.totalQuestions) * 100);

    const result = {
        exam: { course: data.examCourse, type: data.examType, title: data.examTitle, totalQuestions: data.totalQuestions },
        score: scoreVal,
        correct,
        wrong,
        unanswered,
        timeTaken: formatTime(data.timeSpent),
        tabViolations: data.tabViolations,
        questions: data.questions,
    };

    const getGrade = (score: number) => {
        if (score >= 90) return { letter: "A", color: "var(--success)" };
        if (score >= 80) return { letter: "B", color: "var(--primary-500)" };
        if (score >= 70) return { letter: "C", color: "var(--warning)" };
        if (score >= 60) return { letter: "D", color: "#f97316" };
        return { letter: "F", color: "var(--danger)" };
    };
    const grade = getGrade(result.score);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
                <button onClick={() => router.push("/student/dashboard")} style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    background: "none", border: "none", color: "var(--primary-500)",
                    fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", marginBottom: "1rem",
                }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg> Back to Exam Portal</button>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gray-900)", display: "flex", alignItems: "center", gap: "0.5rem" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg> Exam Result</h1>
                <p style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>{result.exam.title}</p>
            </div>

            {/* Score Overview — responsive */}
            <div className="result-overview">
                {/* Score Circle */}
                <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gray-100)" strokeWidth="8" />
                        <circle cx="60" cy="60" r="52" fill="none" stroke={grade.color} strokeWidth="8"
                            strokeDasharray={`${(result.score / 100) * 327} 327`}
                            strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray 1s ease" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "2rem", fontWeight: 900, color: grade.color }}>{result.score}%</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-500)" }}>Grade {grade.letter}</span>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>{result.exam.course} — {result.exam.type}</h2>
                    <div className="result-stats-grid">
                        <div style={{ background: "var(--success-light)", borderRadius: 12, padding: "0.75rem 1rem" }}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--success)" }}>{result.correct}</div>
                            <div style={{ fontSize: "0.75rem", color: "#065f46" }}>Correct</div>
                        </div>
                        <div style={{ background: "var(--danger-light)", borderRadius: 12, padding: "0.75rem 1rem" }}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--danger)" }}>{result.wrong}</div>
                            <div style={{ fontSize: "0.75rem", color: "#991b1b" }}>Wrong</div>
                        </div>
                        <div style={{ background: "var(--gray-100)", borderRadius: 12, padding: "0.75rem 1rem" }}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--gray-600)" }}>{result.unanswered}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>Unanswered</div>
                        </div>
                        <div style={{ background: "var(--primary-50)", borderRadius: 12, padding: "0.75rem 1rem" }}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-600)" }}>{result.timeTaken}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--primary-500)" }}>Time Taken</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Review */}
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Question Review</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                {result.questions.map(q => {
                    const isCorrect = q.studentAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
                    const isUnanswered = !q.studentAnswer;
                    return (
                        <div key={q.id} style={{
                            background: "#fff", borderRadius: 16, padding: "1.25rem",
                            border: `1.5px solid ${isCorrect ? "var(--success)" : isUnanswered ? "var(--gray-200)" : "var(--danger)"}`,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ width: 28, height: 28, borderRadius: 8, background: isCorrect ? "var(--success)" : isUnanswered ? "var(--gray-400)" : "var(--danger)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>{q.order}</span>
                                    <span style={{
                                        padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
                                        background: q.type === "mcq" ? "var(--primary-50)" : q.type === "truefalse" ? "var(--purple-light)" : "var(--warning-light)",
                                        color: q.type === "mcq" ? "var(--primary-600)" : q.type === "truefalse" ? "#5b21b6" : "#92400e",
                                    }}>
                                        {q.type === "mcq" ? "MCQ" : q.type === "truefalse" ? "T/F" : "Fill"}
                                    </span>
                                </div>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isCorrect ? "var(--success)" : isUnanswered ? "var(--gray-500)" : "var(--danger)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    {isCorrect ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Correct</> : isUnanswered ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg> Skipped</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Wrong</>}
                                </span>
                            </div>
                            <p style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.75rem", lineHeight: 1.5 }}>{q.text}</p>
                            <div className="result-answer-row">
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--gray-400)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Your Answer</div>
                                    <div style={{ padding: "0.5rem 0.75rem", borderRadius: 8,
                                        background: isCorrect ? "var(--success-light)" : isUnanswered ? "var(--gray-50)" : "var(--danger-light)",
                                        fontWeight: isUnanswered ? 400 : 600,
                                        color: isCorrect ? "#065f46" : isUnanswered ? "var(--gray-400)" : "#991b1b",
                                        fontStyle: isUnanswered ? "italic" : "normal",
                                    }}>
                                        {q.studentAnswer
                                            ? q.studentAnswer
                                            : q.type === "fillin"
                                                ? "Left blank"
                                                : "Not answered"}
                                    </div>
                                </div>
                                {!isCorrect && (
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--gray-400)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Correct Answer</div>
                                        <div style={{ padding: "0.5rem 0.75rem", borderRadius: 8, background: "var(--success-light)", fontWeight: 600, color: "#065f46" }}>{q.correctAnswer}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Teacher Grade Feedback */}
            {teacherFeedback && (
                <div style={{ background: "#f0fdf4", border: "1.5px solid var(--success)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.875rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#065f46" }}>Your teacher has reviewed your submission</div>
                            <div style={{ fontSize: "0.75rem", color: "#16a34a" }}>Graded on {teacherFeedback.sentAt} · {teacherFeedback.subject}</div>
                        </div>
                    </div>

                    {/* Assessment breakdown table */}
                    {teacherFeedback.assessments && teacherFeedback.assessments.length > 0 && (
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #bbf7d0", marginBottom: "0.75rem", overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                                <thead>
                                    <tr style={{ background: "#f0fdf4" }}>
                                        <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" as const, fontWeight: 700, fontSize: "0.72rem", color: "#065f46", borderBottom: "1.5px solid #bbf7d0", width: 32 }}>SN</th>
                                        <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" as const, fontWeight: 700, fontSize: "0.72rem", color: "#065f46", borderBottom: "1.5px solid #bbf7d0" }}>Assessment Name</th>
                                        <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" as const, fontWeight: 700, fontSize: "0.72rem", color: "#065f46", borderBottom: "1.5px solid #bbf7d0" }}>Assessment Type</th>
                                        <th style={{ padding: "0.5rem 0.75rem", textAlign: "center" as const, fontWeight: 700, fontSize: "0.72rem", color: "#065f46", borderBottom: "1.5px solid #bbf7d0" }}>Maximum Mark</th>
                                        <th style={{ padding: "0.5rem 0.75rem", textAlign: "center" as const, fontWeight: 700, fontSize: "0.72rem", color: "#065f46", borderBottom: "1.5px solid #bbf7d0" }}>Result</th>
                                        <th style={{ padding: "0.5rem 0.75rem", textAlign: "center" as const, fontWeight: 700, fontSize: "0.72rem", color: "#065f46", borderBottom: "1.5px solid #bbf7d0" }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teacherFeedback.assessments.map((a, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid #dcfce7", background: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                                            <td style={{ padding: "0.45rem 0.75rem", color: "#6b7280", fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}</td>
                                            <td style={{ padding: "0.45rem 0.75rem", fontWeight: 500 }}>{a.name}</td>
                                            <td style={{ padding: "0.45rem 0.75rem" }}>
                                                <span style={{ background: "#dcfce7", color: "#166534", padding: "0.1rem 0.45rem", borderRadius: 5, fontSize: "0.72rem", fontWeight: 600 }}>{a.type}</span>
                                            </td>
                                            <td style={{ padding: "0.45rem 0.75rem", textAlign: "center" as const }}>{a.maxMark}</td>
                                            <td style={{ padding: "0.45rem 0.75rem", textAlign: "center" as const, fontWeight: 700, color: a.result >= a.maxMark * 0.9 ? "#065f46" : a.result >= a.maxMark * 0.7 ? "#1d4ed8" : "#92400e" }}>{a.result}</td>
                                            <td style={{ padding: "0.45rem 0.75rem", textAlign: "center" as const }}></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: "#dcfce7", borderTop: "2px solid #86efac" }}>
                                        <td colSpan={3} style={{ padding: "0.55rem 0.75rem", fontWeight: 700, textAlign: "right" as const, color: "#065f46" }}>Totals</td>
                                        <td style={{ padding: "0.55rem 0.75rem", textAlign: "center" as const, fontWeight: 800 }}>
                                            {teacherFeedback.assessments.reduce((s, a) => s + a.maxMark, 0)}
                                        </td>
                                        <td style={{ padding: "0.55rem 0.75rem", textAlign: "center" as const, fontWeight: 800, color: "#065f46" }}>
                                            {teacherFeedback.assessments.reduce((s, a) => s + a.result, 0)}/{teacherFeedback.assessments.reduce((s, a) => s + a.maxMark, 0)}
                                        </td>
                                        <td style={{ padding: "0.55rem 0.75rem", textAlign: "center" as const, fontWeight: 800, fontSize: "0.95rem", color: "#065f46" }}>{teacherFeedback.grade}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Score + Grade summary boxes (shown when no assessment breakdown, or always) */}
                    {(!teacherFeedback.assessments || teacherFeedback.assessments.length === 0) && (
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: teacherFeedback.comment ? "0.75rem" : 0 }}>
                            <div style={{ background: "#fff", borderRadius: 12, padding: "0.6rem 1.25rem", flex: 1, minWidth: 100 }}>
                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Teacher Score</div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--success)" }}>{teacherFeedback.score}%</div>
                            </div>
                            <div style={{ background: "#fff", borderRadius: 12, padding: "0.6rem 1.25rem", flex: 1, minWidth: 100 }}>
                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Grade</div>
                                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--success)" }}>{teacherFeedback.grade}</div>
                            </div>
                        </div>
                    )}

                    {teacherFeedback.comment && (
                        <div style={{ background: "#fff", borderRadius: 10, padding: "0.75rem 1rem", border: "1px solid #bbf7d0" }}>
                            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Teacher Feedback</div>
                            <p style={{ fontSize: "0.875rem", color: "#065f46", lineHeight: 1.6, margin: 0 }}>{teacherFeedback.comment}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
