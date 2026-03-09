"use client";
export default function AdminDashboard() {
    const stats = [
        { label: "Total Students", value: "1,247", icon: "🎓", color: "blue", change: "+45 this month", positive: true },
        { label: "Total Teachers", value: "68", icon: "📚", color: "green", change: "+3 new", positive: true },
        { label: "Avg. Attendance", value: "89%", icon: "✅", color: "purple", change: "+2.3%", positive: true },
        { label: "Avg. Performance", value: "82%", icon: "📊", color: "orange", change: "+1.1%", positive: true },
    ];

    const gradePerformance = [
        { grade: "Grade 9", students: 320, attendance: 91, avg: 84 },
        { grade: "Grade 10", students: 310, attendance: 88, avg: 81 },
        { grade: "Grade 11", students: 315, attendance: 90, avg: 83 },
        { grade: "Grade 12", students: 302, attendance: 87, avg: 80 },
    ];

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">School Analytics Dashboard</h1>
                    <p className="page-subtitle">School-wide performance overview</p>
                </div>
                <button className="btn btn-primary">📥 Export Report</button>
            </div>

            <div className="stats-grid">
                {stats.map((s) => (
                    <div className="stat-card" key={s.label}>
                        <div className={`stat-icon ${s.color}`}><span style={{ fontSize: "1.25rem" }}>{s.icon}</span></div>
                        <div className="stat-info">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value">{s.value}</div>
                            <div className={`stat-change ${s.positive ? "positive" : "negative"}`}>↑ {s.change}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div className="card-header"><h3 className="card-title">Grade Level Performance</h3></div>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Grade</th><th>Students</th><th>Avg Attendance</th><th>Avg Score</th><th>Performance</th></tr></thead>
                        <tbody>
                            {gradePerformance.map((g) => (
                                <tr key={g.grade}>
                                    <td style={{ fontWeight: 600 }}>{g.grade}</td>
                                    <td>{g.students}</td>
                                    <td>{g.attendance}%</td>
                                    <td><span className={`badge ${g.avg >= 85 ? "badge-success" : g.avg >= 80 ? "badge-primary" : "badge-warning"}`}>{g.avg}%</span></td>
                                    <td style={{ width: 160 }}>
                                        <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${g.avg}%` }}></div></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="content-grid">
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>Recent Registrations</h3>
                    {[
                        { name: "New Student: Yared Bekele", type: "student", time: "2h ago" },
                        { name: "New Parent: Mrs. Almaz", type: "parent", time: "5h ago" },
                        { name: "Teacher Updated: Ms. Sara", type: "teacher", time: "1d ago" },
                    ].map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0", borderBottom: "1px solid var(--gray-50)" }}>
                            <span style={{ fontSize: "1.25rem" }}>{r.type === "student" ? "🎓" : r.type === "parent" ? "👨‍👩‍👧" : "📚"}</span>
                            <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{r.name}</div><div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{r.time}</div></div>
                        </div>
                    ))}
                </div>
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>Student Feedback Summary</h3>
                    {[
                        { subject: "Mathematics", rating: 4.5, count: 124 },
                        { subject: "Physics", rating: 4.2, count: 98 },
                        { subject: "Chemistry", rating: 3.8, count: 112 },
                        { subject: "English", rating: 4.6, count: 130 },
                    ].map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid var(--gray-50)" }}>
                            <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{f.subject}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ color: "var(--warning)", fontSize: "0.875rem" }}>{"⭐".repeat(Math.max(0, Math.round(f.rating)))}</span>
                                <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{f.rating} ({f.count})</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
