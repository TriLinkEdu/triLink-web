"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * Student · Exam result — reskinned to match the TRILINK kit's
 * `<ExamResults/>` (`surfaces.jsx` lines 496-595): score-reveal hero,
 * 4-tile stat grid, question-by-question review row table. We keep all
 * the real backend wiring (`getAttemptResult`) and CSV export from the
 * previous implementation; only the visual layer changes.
 */
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAttemptResult, type AttemptResult } from "@/lib/admin-api";
import { toLetterGrade } from "@/lib/grading";
import { Icon, ProgressRing, StatGrid, StatTile } from "@/components/kit";

type QuestionType = "mcq" | "truefalse" | "fillin";

type ReviewQuestion = {
    id: string;
    order: number;
    type: QuestionType;
    text: string;
    options?: string[];
    correctAnswer: string;
    studentAnswer: string;
    points: number;
};

export default function ExamResultPage() {
    const router = useRouter();
    const params = useParams<{ examId: string }>();
    const attemptId = params?.examId ?? "";

    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const [data, setData] = useState<AttemptResult | null>(null);

    useEffect(() => {
        if (!attemptId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setLoadErr(null);
            try {
                const result = await getAttemptResult(attemptId);
                if (!cancelled) setData(result);
            } catch (e) {
                if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Failed to load result");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [attemptId]);

    if (loading) {
        return (
            <div className="kit-page" data-role="student" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
                Loading result…
            </div>
        );
    }

    if (loadErr || !data) {
        const pending = /release|released|not available|not found|pending/i.test(loadErr || "");
        return (
            <div className="kit-page" data-role="student">
                <button type="button" onClick={() => router.push("/student/dashboard")} className="btn-kit btn-kit-ghost" style={{ marginBottom: 14, paddingLeft: 0 }}>
                    <Icon name="chev" size={11} className="-rotate-180" /> Back to dashboard
                </button>
                <div className="k-card" style={{ padding: "32px 28px", textAlign: "center" }}>
                    <Icon name={pending ? "clock" : "alertTri"} size={28} />
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", marginTop: 8 }}>
                        {pending ? "Result pending release" : "Could not load result"}
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.55, maxWidth: 480, marginInline: "auto" }}>
                        {pending
                            ? "Your attempt has been submitted, but the teacher has not released the result yet. Check back after grading is complete."
                            : loadErr || "Result not available yet."}
                    </p>
                </div>
            </div>
        );
    }

    const questions: ReviewQuestion[] = (data.questions || []).map((q, _i) => {
        let options: string[] | undefined;
        if (q.optionsJson) { try { options = JSON.parse(q.optionsJson); } catch { /* ignore */ } }
        let type: QuestionType = "fillin";
        if (q.type === "mcq" || q.type === "choose") type = "mcq";
        else if (q.type === "truefalse") type = "truefalse";
        else if (q.type === "fillin") type = "fillin";
        return {
            id: q.id,
            order: q.orderIndex + 1,
            type,
            text: q.stem,
            options,
            correctAnswer: q.answerKey ?? "",
            studentAnswer: q.studentAnswer ?? "",
            points: q.points,
        };
    });

    const scoreVal = data.score ?? 0;
    const maxPoints = data.maxPoints || 100;
    const pct = Math.round((scoreVal / maxPoints) * 100);
    const correct = questions.filter((q) => q.studentAnswer && q.correctAnswer && q.studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length;
    const unanswered = questions.filter((q) => !q.studentAnswer).length;
    const wrong = questions.length - correct - unanswered;
    const submittedAtLabel = new Date(data.submittedAt).toLocaleString();
    const tabViolations = data.violations?.length ?? 0;
    const grade = toLetterGrade(pct);
    const successTone = pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";

    return (
        <div className="kit-page" data-role="student">
            <button type="button" onClick={() => router.push("/student/dashboard")} className="btn-kit btn-kit-ghost" style={{ marginBottom: 14, paddingLeft: 0 }}>
                <Icon name="chev" size={11} className="-rotate-180" /> Back
            </button>

            {/* Score hero */}
            <div className="k-card" style={{ marginBottom: 14, padding: "30px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30, flexWrap: "wrap" }}>
                    <div>
                        <div style={{
                            fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase",
                            letterSpacing: "0.06em", fontWeight: 500, marginBottom: 8,
                        }}>
                            Your result
                        </div>
                        <h1 style={{
                            fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em",
                            margin: 0, lineHeight: 1.1,
                        }}>
                            You scored{" "}
                            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: successTone }}>
                                {pct}%
                            </span>
                        </h1>
                        <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8 }}>
                            {data.examTitle} · {scoreVal} of {maxPoints} points
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                            <button type="button" className="btn-kit btn-kit-primary"><Icon name="paper" /> Review answers</button>
                            <button type="button" className="btn-kit btn-kit-ai"><Icon name="sparkles" /> Practice your misses</button>
                            <button
                                type="button"
                                className="btn-kit btn-kit-secondary"
                                onClick={() => downloadResultCsv(data, questions, pct, grade)}
                            >
                                <Icon name="download" /> Download CSV
                            </button>
                        </div>
                    </div>
                    <ProgressRing value={pct} size={120} label={grade} tone="auto" />
                </div>
            </div>

            <StatGrid cols={4} style={{ marginBottom: 14 }}>
                <StatTile icon="check"    label="Correct"    value={`${correct}`} note={`${pct}% accuracy`} />
                <StatTile icon="alertTri" label="Wrong"      value={`${wrong}`}   note="see review below" />
                <StatTile icon="minus"    label="Unanswered" value={`${unanswered}`} note={unanswered === 0 ? "every question attempted" : "skipped questions"} />
                <StatTile icon="shield"   label="Integrity"  value={`${tabViolations}`} note={tabViolations === 0 ? "no violations" : "tab-switch events"} />
            </StatGrid>

            {tabViolations > 0 ? (
                <div className="k-card" style={{
                    marginBottom: 14,
                    background: "var(--danger-soft)",
                    borderColor: "rgba(196,53,84,0.20)",
                    padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                }}>
                    <Icon name="shield" size={18} className="text-[var(--danger)]" />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--danger)" }}>
                            Integrity violations recorded
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 2 }}>
                            {tabViolations} tab-switch or focus-loss event(s) were detected during the exam.
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="k-card">
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">Question-by-question review</div>
                        <div className="k-card__sub">{questions.length} questions · submitted {submittedAtLabel}</div>
                    </div>
                </div>
                <div>
                    {questions.map((q, i) => {
                        const isCorrect = !!q.studentAnswer && !!q.correctAnswer
                            && q.studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                        const isUnanswered = !q.studentAnswer;
                        return (
                            <div
                                key={q.id}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "32px 60px 1fr auto auto 30px",
                                    gap: 14,
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    borderBottom: i < questions.length - 1 ? "1px solid var(--hairline)" : "0",
                                }}
                            >
                                <div style={{
                                    width: 22, height: 22, borderRadius: 6,
                                    background: isCorrect ? "var(--success-soft)" : isUnanswered ? "var(--surface-2)" : "var(--danger-soft)",
                                    color: isCorrect ? "var(--success)" : isUnanswered ? "var(--ink-3)" : "var(--danger)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Icon name={isCorrect ? "check" : isUnanswered ? "minus" : "asterisk"} size={12} />
                                </div>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                                    Q{String(q.order).padStart(2, "0")}
                                </span>
                                <span style={{ fontSize: 13, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                                    {q.text}
                                </span>
                                <span style={{
                                    fontFamily: "var(--font-mono)", fontSize: 11.5,
                                    color: isCorrect ? "var(--ink-2)" : isUnanswered ? "var(--ink-4)" : "var(--danger)",
                                }}>
                                    {q.studentAnswer || (q.type === "fillin" ? "Left blank" : "—")}
                                </span>
                                {!isCorrect && q.correctAnswer ? (
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--success)" }}>
                                        → {q.correctAnswer}
                                    </span>
                                ) : (
                                    <span />
                                )}
                                <Icon name="chev" size={11} className="text-[var(--ink-4)]" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function csvCell(value: unknown) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function downloadResultCsv(
    data: AttemptResult,
    questions: ReviewQuestion[],
    scorePercent: number,
    gradeLetter: string,
) {
    const rows: Array<Array<string | number>> = [
        ["Exam", data.examTitle],
        ["Attempt ID", data.attemptId],
        ["Score", `${data.score ?? 0}/${data.maxPoints}`],
        ["Percent", `${scorePercent}%`],
        ["Grade", gradeLetter],
        ["Submitted", data.submittedAt],
        ["Released", data.releasedAt ?? ""],
        [],
        ["Question", "Prompt", "Student Answer", "Correct Answer", "Points"],
        ...questions.map((q) => [q.order, q.text, q.studentAnswer, q.correctAnswer, q.points]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.examTitle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "exam"}-result.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
