"use client";
import { useState, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/* ─── helpers ─── */
function renderLatex(raw: string): string {
    if (!raw) return "";
    let out = raw.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
        try { return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); }
        catch { return `<code>$$${tex}$$</code>`; }
    });
    out = out.replace(/\$([^\n$]+?)\$/g, (_m, tex) => {
        try { return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); }
        catch { return `<code>$${tex}$</code>`; }
    });
    out = out.replace(/\n/g, "<br />");
    return out;
}

const LATEX_SNIPPETS = [
    { label: "a/b", snippet: "\\frac{a}{b}", tip: "Fraction" },
    { label: "√", snippet: "\\sqrt{x}", tip: "Square root" },
    { label: "x²", snippet: "x^{2}", tip: "Superscript" },
    { label: "xₙ", snippet: "x_{n}", tip: "Subscript" },
    { label: "∫", snippet: "\\int_{a}^{b} f(x)\\,dx", tip: "Integral" },
    { label: "∑", snippet: "\\sum_{i=1}^{n} x_i", tip: "Summation" },
    { label: "∞", snippet: "\\infty", tip: "Infinity" },
    { label: "π", snippet: "\\pi", tip: "Pi" },
    { label: "α", snippet: "\\alpha", tip: "Alpha" },
    { label: "β", snippet: "\\beta", tip: "Beta" },
    { label: "θ", snippet: "\\theta", tip: "Theta" },
    { label: "≠", snippet: "\\neq", tip: "Not equal" },
    { label: "≤", snippet: "\\leq", tip: "≤" },
    { label: "≥", snippet: "\\geq", tip: "≥" },
    { label: "→", snippet: "\\rightarrow", tip: "Arrow" },
    { label: "±", snippet: "\\pm", tip: "Plus-minus" },
    { label: "×", snippet: "\\times", tip: "Times" },
    { label: "÷", snippet: "\\div", tip: "Divide" },
    { label: "Matrix", snippet: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", tip: "2×2 matrix" },
];

interface Question {
    id: number;
    text: string;
    options: Record<"A" | "B" | "C" | "D", string>;
    correct: "A" | "B" | "C" | "D" | "";
    points: number;
}

const blankQ = (): Question => ({ id: Date.now(), text: "", options: { A: "", B: "", C: "", D: "" }, correct: "", points: 1 });

interface LatexFieldProps { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; }

function LatexField({ label, value, onChange, rows = 3, placeholder }: LatexFieldProps) {
    const [tab, setTab] = useState<"write" | "preview">("write");
    const textareaRef = useCallback((node: HTMLTextAreaElement | null) => { if (node) (window as unknown as Record<string, HTMLTextAreaElement>)[`_lf_${label}`] = node; }, [label]);

    const insert = (snippet: string) => {
        const ta = (window as unknown as Record<string, HTMLTextAreaElement>)[`_lf_${label}`];
        if (ta) {
            const s = ta.selectionStart ?? value.length;
            const e = ta.selectionEnd ?? value.length;
            onChange(value.slice(0, s) + `$${snippet}$` + value.slice(e));
            setTimeout(() => { ta.focus(); ta.setSelectionRange(s + snippet.length + 2, s + snippet.length + 2); }, 0);
        } else { onChange(value + `$${snippet}$`); }
    };

    return (
        <div style={{ marginBottom: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                <div style={{ display: "flex", gap: "0.2rem" }}>
                    {(["write", "preview"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ padding: "0.15rem 0.55rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, border: "1.5px solid", borderColor: tab === t ? "var(--primary-500)" : "var(--gray-200)", background: tab === t ? "var(--primary-50)" : "#fff", color: tab === t ? "var(--primary-600)" : "var(--gray-400)", cursor: "pointer" }}>
                            {t === "write" ? "Write" : "Preview"}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginBottom: "0.4rem" }}>
                {LATEX_SNIPPETS.map(s => (
                    <button key={s.label} title={s.tip} onClick={() => insert(s.snippet)}
                        style={{ padding: "0.15rem 0.45rem", borderRadius: 5, border: "1.5px solid var(--gray-200)", background: "#fff", fontSize: "0.72rem", fontWeight: 600, color: "var(--gray-700)", cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-50)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary-300)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gray-200)"; }}>
                        {s.label}
                    </button>
                ))}
            </div>
            {tab === "write" ? (
                <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
                    style={{ width: "100%", padding: "0.65rem 0.9rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontFamily: "monospace", resize: "vertical", lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = "var(--primary-400)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-50)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--gray-200)"; e.target.style.boxShadow = "none"; }} />
            ) : (
                <div style={{ minHeight: rows * 26, padding: "0.65rem 0.9rem", background: "var(--gray-50)", border: "1.5px solid var(--primary-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: value ? renderLatex(value) : "<em style='color:var(--gray-400)'>Nothing to preview…</em>" }} />
            )}
            <p style={{ fontSize: "0.68rem", color: "var(--gray-400)", marginTop: "0.2rem" }}>Use <code>$...$</code> for inline math, <code>$$...$$</code> for block</p>
        </div>
    );
}

const BANK_QUESTIONS = [
    { q: "Find the derivative of $f(x) = x^3 + 2x^2 - 5x$", subj: "Mathematics", type: "Multiple Choice", used: 3 },
    { q: "Explain Newton&apos;s Second Law of Motion", subj: "Physics", type: "Short Answer", used: 5 },
    { q: "Balance: $\\text{H}_2 + \\text{O}_2 \\rightarrow \\text{H}_2\\text{O}$", subj: "Chemistry", type: "Multiple Choice", used: 2 },
    { q: "Area under $y = x^2$ from $0$ to $3$", subj: "Mathematics", type: "Problem Solving", used: 1 },
    { q: "Electric field at distance $r$ from charge $q$?", subj: "Physics", type: "Multiple Choice", used: 4 },
    { q: "Molecular formula of glucose", subj: "Chemistry", type: "Multiple Choice", used: 6 },
];

export default function TeacherExams() {
    const [activeTab, setActiveTab] = useState<"create" | "bank" | "results">("create");

    // Quiz meta
    const [quizTitle, setQuizTitle] = useState("");
    const [subject, setSubject] = useState("Mathematics");
    const [classGroup, setClassGroup] = useState("Grade 11-A");
    const [duration, setDuration] = useState("30");

    // Questions
    const [questions, setQuestions] = useState<Question[]>([blankQ()]);
    const [activeQ, setActiveQ] = useState(0);
    const q = questions[activeQ];
    const updateQ = (patch: Partial<Question>) =>
        setQuestions(prev => prev.map((qq, i) => i === activeQ ? { ...qq, ...patch } : qq));

    // Results
    const [results, setResults] = useState([
        { name: "Abebe Kebede", quiz: "Ch.7 Calculus Quiz", score: 92, grade: "A", sent: false },
        { name: "Kalkidan Assefa", quiz: "Ch.7 Calculus Quiz", score: 88, grade: "A-", sent: false },
        { name: "Meron Girma", quiz: "Ch.7 Calculus Quiz", score: 75, grade: "B", sent: true },
        { name: "Samuel Dereje", quiz: "Ch.7 Calculus Quiz", score: 95, grade: "A+", sent: true },
    ]);

    // Toast
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

    const addQuestion = () => { setQuestions(p => [...p, blankQ()]); setActiveQ(questions.length); };
    const removeQuestion = (idx: number) => { if (questions.length === 1) return; setQuestions(p => p.filter((_, i) => i !== idx)); setActiveQ(Math.min(idx, questions.length - 2)); };

    const handlePublish = () => {
        if (!quizTitle.trim()) { showToast("Enter a quiz title", false); return; }
        const bad = questions.filter(qq => !qq.correct || !qq.text.trim());
        if (bad.length) { showToast(`${bad.length} question(s) incomplete`, false); return; }
        showToast(`"${quizTitle}" published to ${classGroup} ✓`);
        setQuizTitle(""); setQuestions([blankQ()]); setActiveQ(0);
    };

    return (
        <div className="page-wrapper">
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#fff", borderRadius: 14, padding: "1rem 1.5rem", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: `1.5px solid ${toast.ok ? "var(--success)" : "var(--danger)"}`, display: "flex", alignItems: "center", gap: "0.75rem", animation: "fadeIn 0.3s ease" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: toast.ok ? "var(--success-light)" : "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", color: toast.ok ? "var(--success)" : "var(--danger)" }}>
                        {toast.ok ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.msg}</span>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        Exams & Assessments
                    </h1>
                    <p className="page-subtitle">Create quizzes with live LaTeX preview, manage exam bank &amp; grades</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: "1.5rem" }}>
                <button className={`tab ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>Create Quiz</button>
                <button className={`tab ${activeTab === "bank" ? "active" : ""}`} onClick={() => setActiveTab("bank")}>Exam Bank</button>
                <button className={`tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")}>Results &amp; Grades</button>
            </div>

            {/* ── CREATE ── */}
            {activeTab === "create" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem", alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* Meta */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: "1rem" }}>Quiz Details</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="input-group"><label>Quiz Title</label><div className="input-field"><input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="e.g., Chapter 7 — Calculus Quiz" /></div></div>
                                <div className="input-group"><label>Subject</label>
                                    <select value={subject} onChange={e => setSubject(e.target.value)} style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", width: "100%" }}>
                                        <option>Mathematics</option><option>Physics</option><option>Chemistry</option><option>Biology</option>
                                    </select>
                                </div>
                                <div className="input-group"><label>Class</label>
                                    <select value={classGroup} onChange={e => setClassGroup(e.target.value)} style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", width: "100%" }}>
                                        <option>Grade 11-A</option><option>Grade 11-B</option><option>Grade 12-A</option><option>Grade 12-B</option>
                                    </select>
                                </div>
                                <div className="input-group"><label>Duration (min)</label><div className="input-field"><input type="number" value={duration} min={5} max={180} onChange={e => setDuration(e.target.value)} /></div></div>
                            </div>
                        </div>

                        {/* Question editor */}
                        <div className="card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <h3 className="card-title">Question {activeQ + 1} of {questions.length}</h3>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>Points:</label>
                                    <input type="number" min={1} max={20} value={q.points} onChange={e => updateQ({ points: parseInt(e.target.value) || 1 })}
                                        style={{ width: 52, padding: "0.3rem 0.5rem", border: "1.5px solid var(--gray-200)", borderRadius: 8, fontSize: "0.85rem", textAlign: "center" }} />
                                    {questions.length > 1 && (
                                        <button onClick={() => removeQuestion(activeQ)} style={{ padding: "0.3rem 0.65rem", borderRadius: 8, border: "1.5px solid var(--danger-light)", background: "var(--danger-light)", color: "var(--danger)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Remove</button>
                                    )}
                                </div>
                            </div>

                            <LatexField label="Question Text" value={q.text} onChange={v => updateQ({ text: v })} rows={4}
                                placeholder={"Type question here…\n\nExample: Find the derivative of $f(x) = x^3 + 2x$"} />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.875rem" }}>
                                {(["A", "B", "C", "D"] as const).map(opt => (
                                    <LatexField key={opt} label={`Option ${opt}`} value={q.options[opt]} onChange={v => updateQ({ options: { ...q.options, [opt]: v } })} rows={2} placeholder={`Option ${opt}`} />
                                ))}
                            </div>

                            <div>
                                <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Correct Answer</label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    {(["A", "B", "C", "D"] as const).map(o => (
                                        <button key={o} onClick={() => updateQ({ correct: o })} className={`btn ${q.correct === o ? "btn-primary" : "btn-outline"}`} style={{ width: 48, position: "relative" }}>
                                            {o}
                                            {q.correct === o && (
                                                <span style={{ position: "absolute", top: -6, right: -6, width: 14, height: 14, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {q.correct && <p style={{ fontSize: "0.78rem", color: "var(--success)", marginTop: "0.4rem", fontWeight: 500 }}>✓ Option {q.correct} is the correct answer</p>}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" onClick={addQuestion} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Question
                            </button>
                            <button className="btn btn-outline" onClick={() => { if (!quizTitle.trim()) { showToast("Enter a title first", false); return; } showToast("Saved to exam bank ✓"); }}>Save to Bank</button>
                            <button className="btn btn-primary" onClick={handlePublish} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9l20-7z" /></svg>
                                Publish Quiz
                            </button>
                        </div>
                    </div>

                    {/* Right: navigator + cheatsheet */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1rem" }}>
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: "0.875rem" }}>Questions</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 380, overflowY: "auto" }}>
                                {questions.map((qq, i) => (
                                    <button key={qq.id} onClick={() => setActiveQ(i)} style={{ padding: "0.6rem 0.75rem", borderRadius: 10, textAlign: "left", border: `2px solid ${activeQ === i ? "var(--primary-400)" : "var(--gray-200)"}`, background: activeQ === i ? "var(--primary-50)" : "#fff", cursor: "pointer" }}>
                                        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: activeQ === i ? "var(--primary-600)" : "var(--gray-600)" }}>Q{i + 1}</div>
                                        <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{qq.text ? qq.text.replace(/\$[^$]*\$/g, "[math]").slice(0, 45) : <em>No text yet</em>}</div>
                                        <div style={{ marginTop: 3, display: "flex", gap: "0.25rem" }}>
                                            {qq.correct && <span style={{ fontSize: "0.62rem", padding: "0.1rem 0.35rem", borderRadius: 4, background: "var(--success-light)", color: "#065f46", fontWeight: 600 }}>Ans: {qq.correct}</span>}
                                            <span style={{ fontSize: "0.62rem", padding: "0.1rem 0.35rem", borderRadius: 4, background: "var(--gray-100)", color: "var(--gray-500)" }}>{qq.points}pt</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginTop: "0.875rem", padding: "0.65rem", background: "var(--gray-50)", borderRadius: 10 }}>
                                <div style={{ fontSize: "0.76rem", color: "var(--gray-500)" }}>{questions.length} question(s) · {questions.reduce((s, qq) => s + qq.points, 0)} pts · {duration} min</div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: "0.75rem", fontSize: "0.82rem" }}>LaTeX Quick Ref</h3>
                            {[["Fraction", "$\\\\frac{a}{b}$"], ["Root", "$\\\\sqrt{x}$"], ["Integral", "$\\\\int_a^b$"], ["Block", "$$E=mc^2$$"], ["Sub", "$x_{n}$"], ["Sup", "$x^{2}$"], ["Pi", "$\\\\pi$"], ["Sum", "$\\\\sum_i$"]].map(([nm, ex]) => (
                                <div key={nm} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.73rem", padding: "0.2rem 0", borderBottom: "1px solid var(--gray-100)" }}>
                                    <span style={{ color: "var(--gray-500)" }}>{nm}</span>
                                    <code style={{ color: "var(--primary-700)", background: "var(--primary-50)", padding: "0.1rem 0.35rem", borderRadius: 4 }}>{ex}</code>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── BANK ── */}
            {activeTab === "bank" && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Exam Bank</h3>
                        <div className="header-search" style={{ width: 240 }}><input placeholder="Search questions..." /></div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Question</th><th>Subject</th><th>Type</th><th>Used</th><th>Action</th></tr></thead>
                            <tbody>
                                {BANK_QUESTIONS.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ maxWidth: 320 }}><div dangerouslySetInnerHTML={{ __html: renderLatex(item.q) }} style={{ fontSize: "0.875rem", fontWeight: 500 }} /></td>
                                        <td><span className="badge badge-primary">{item.subj}</span></td>
                                        <td style={{ fontSize: "0.85rem" }}>{item.type}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{item.used}×</td>
                                        <td><div style={{ display: "flex", gap: "0.375rem" }}><button className="btn btn-outline btn-sm">Edit</button><button className="btn btn-secondary btn-sm">Use</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── RESULTS ── */}
            {activeTab === "results" && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Student Results</h3>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-primary btn-sm" onClick={() => { setResults(p => p.map(r => ({ ...r, sent: true }))); showToast("All grades sent ✓"); }}>Send All Grades</button>
                            <button className="btn btn-outline btn-sm">Export CSV</button>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>Grade</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {results.map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{s.quiz}</td>
                                        <td style={{ fontWeight: 700, color: s.score >= 90 ? "var(--success)" : s.score >= 80 ? "var(--primary-600)" : "var(--warning)" }}>{s.score}%</td>
                                        <td><span className={`badge ${s.score >= 90 ? "badge-success" : s.score >= 80 ? "badge-primary" : "badge-warning"}`}>{s.grade}</span></td>
                                        <td>{s.sent ? <span className="badge badge-success">Sent</span> : <span className="badge badge-warning">Pending</span>}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.375rem" }}>
                                                <button className="btn btn-outline btn-sm">Evaluate</button>
                                                {!s.sent && <button className="btn btn-primary btn-sm" onClick={() => { setResults(p => p.map((r, ri) => ri === i ? { ...r, sent: true } : r)); showToast(`Grade sent to ${s.name} ✓`); }}>Send Grade</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

