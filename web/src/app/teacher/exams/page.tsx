"use client";
import { useState } from "react";

export default function TeacherExams() {
    const [activeTab, setActiveTab] = useState<"create" | "bank" | "results">("create");
    const [correctAnswer, setCorrectAnswer] = useState<string>("");

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Exams & Assessments</h1>
                    <p className="page-subtitle">Create quizzes, manage exam bank, and view results</p>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>📝 Create Quiz</button>
                <button className={`tab ${activeTab === "bank" ? "active" : ""}`} onClick={() => setActiveTab("bank")}>🏦 Exam Bank</button>
                <button className={`tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")}>📊 Results & Grades</button>
            </div>

            {activeTab === "create" && (
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>Create New Quiz</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                        <div className="input-group">
                            <label>Quiz Title</label>
                            <div className="input-field"><input placeholder="e.g., Chapter 7 - Calculus Quiz" /></div>
                        </div>
                        <div className="input-group">
                            <label>Subject</label>
                            <select style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit" }}>
                                <option>Mathematics</option><option>Physics</option><option>Chemistry</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Class</label>
                            <select style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit" }}>
                                <option>Grade 11-A</option><option>Grade 11-B</option><option>Grade 12-A</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Duration</label>
                            <div className="input-field"><input placeholder="30 minutes" /></div>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: "1rem" }}>
                        <label>Question (LaTeX supported: use $...$ for inline, $$...$$ for block)</label>
                        <textarea placeholder="Enter your question here...&#10;&#10;Example: Find the derivative of $f(x) = x^3 + 2x^2 - 5x + 1$" rows={4}
                            style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "monospace", resize: "vertical" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        {["A", "B", "C", "D"].map(opt => (
                            <div key={opt} className="input-group">
                                <label>Option {opt}</label>
                                <div className="input-field"><input placeholder={`Option ${opt}`} /></div>
                            </div>
                        ))}
                    </div>

                    <div className="input-group" style={{ marginBottom: "1.5rem" }}>
                        <label>Correct Answer</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {["A", "B", "C", "D"].map(o => (
                                <button
                                    key={o}
                                    onClick={() => setCorrectAnswer(o)}
                                    className={`btn ${correctAnswer === o ? "btn-primary" : "btn-outline"}`}
                                    style={{ width: 48, position: "relative" }}
                                >
                                    {o}
                                    {correctAnswer === o && (
                                        <span style={{ position: "absolute", top: -6, right: -6, width: 14, height: 14, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {correctAnswer && (
                            <p style={{ fontSize: "0.78rem", color: "var(--success)", marginTop: "0.4rem", fontWeight: 500 }}>
                                ✓ Option {correctAnswer} marked as correct answer
                            </p>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button className="btn btn-secondary">+ Add Question</button>
                        <button className="btn btn-primary">Save to Bank</button>
                        <button className="btn btn-success">Publish Quiz</button>
                    </div>
                </div>
            )}

            {activeTab === "bank" && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Exam Bank</h3>
                        <div className="header-search" style={{ width: 240 }}>
                            <input placeholder="Search questions..." />
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Question</th><th>Subject</th><th>Type</th><th>Used</th><th>Action</th></tr></thead>
                            <tbody>
                                {[
                                    { q: "Find the derivative of f(x) = x³ + 2x² - 5x", subj: "Mathematics", type: "Multiple Choice", used: 3 },
                                    { q: "Explain Newton's Second Law of Motion", subj: "Physics", type: "Short Answer", used: 5 },
                                    { q: "Balance the equation: H₂ + O₂ → H₂O", subj: "Chemistry", type: "Multiple Choice", used: 2 },
                                    { q: "Calculate the area under the curve y = x²", subj: "Mathematics", type: "Problem Solving", used: 1 },
                                ].map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500, maxWidth: 300 }}>{item.q}</td>
                                        <td><span className="badge badge-primary">{item.subj}</span></td>
                                        <td>{item.type}</td>
                                        <td>{item.used} times</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.375rem" }}>
                                                <button className="btn btn-outline btn-sm">Edit</button>
                                                <button className="btn btn-secondary btn-sm">Use</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "results" && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Student Results</h3>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-primary btn-sm">Send Grades</button>
                            <button className="btn btn-outline btn-sm">Export CSV</button>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>Grade</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {[
                                    { name: "Abebe Kebede", quiz: "Ch.7 Calculus Quiz", score: 92, grade: "A", sent: false },
                                    { name: "Kalkidan Assefa", quiz: "Ch.7 Calculus Quiz", score: 88, grade: "A-", sent: false },
                                    { name: "Meron Girma", quiz: "Ch.7 Calculus Quiz", score: 75, grade: "B", sent: true },
                                    { name: "Samuel Dereje", quiz: "Ch.7 Calculus Quiz", score: 95, grade: "A+", sent: true },
                                ].map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.quiz}</td>
                                        <td style={{ fontWeight: 700, color: s.score >= 90 ? "var(--success)" : s.score >= 80 ? "var(--primary-600)" : "var(--warning)" }}>{s.score}%</td>
                                        <td><span className={`badge ${s.score >= 90 ? "badge-success" : s.score >= 80 ? "badge-primary" : "badge-warning"}`}>{s.grade}</span></td>
                                        <td>{s.sent ? <span className="badge badge-success">Sent</span> : <span className="badge badge-warning">Pending</span>}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.375rem" }}>
                                                <button className="btn btn-outline btn-sm">Evaluate</button>
                                                {!s.sent && <button className="btn btn-primary btn-sm">Send Grade</button>}
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
