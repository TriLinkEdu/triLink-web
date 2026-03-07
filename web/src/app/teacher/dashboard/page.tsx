"use client";

const StatIcons = {
    students: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    classes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
    attendance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    grades: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
};

export default function TeacherDashboard() {
    const stats = [
        { label: "Total Students", value: "156", iconKey: "students" as const, color: "blue", change: "+8 new", positive: true },
        { label: "Classes Today", value: "4", iconKey: "classes" as const, color: "green", change: "2 remaining", positive: true },
        { label: "Avg. Attendance", value: "91%", iconKey: "attendance" as const, color: "purple", change: "+1.5%", positive: true },
        { label: "Pending Grades", value: "12", iconKey: "grades" as const, color: "orange", change: "3 urgent", positive: false },
    ];

    const classes = [
        { name: "Grade 11-A Mathematics", students: 42, time: "8:00 - 8:45", status: "completed" },
        { name: "Grade 11-B Mathematics", students: 38, time: "9:00 - 9:45", status: "completed" },
        { name: "Grade 12-A Calculus", students: 35, time: "10:00 - 10:45", status: "ongoing" },
        { name: "Grade 12-B Calculus", students: 41, time: "11:00 - 11:45", status: "upcoming" },
    ];

    const recentActivity = [
        { action: "Graded Quiz - Grade 11-A", time: "30 min ago", type: "grade" },
        { action: "Marked attendance - Grade 12-A", time: "1 hour ago", type: "attendance" },
        { action: "Created new quiz for Chapter 7", time: "2 hours ago", type: "exam" },
        { action: "Received feedback from admin", time: "3 hours ago", type: "notification" },
    ];

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Good morning, Mr. Solomon! ☀️</h1>
                    <p className="page-subtitle">Here&apos;s your teaching overview for today.</p>
                </div>
            </div>

            <div className="stats-grid">
                {stats.map((stat) => (
                    <div className="stat-card" key={stat.label}>
                        <div className={`stat-icon ${stat.color}`}>{StatIcons[stat.iconKey]}</div>
                        <div className="stat-info">
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-change ${stat.positive ? "positive" : "negative"}`}>{stat.positive ? "↑" : "⚠"} {stat.change}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="content-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Today&apos;s Classes</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {classes.map((c, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.875rem", background: "var(--gray-50)", borderRadius: "var(--radius-md)",
                                borderLeft: `3px solid ${c.status === "completed" ? "var(--success)" : c.status === "ongoing" ? "var(--primary-500)" : "var(--gray-300)"}`,
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>{c.students} students · {c.time}</div>
                                </div>
                                <span className={`badge ${c.status === "completed" ? "badge-success" : c.status === "ongoing" ? "badge-primary" : "badge-warning"}`}>
                                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Activity</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {recentActivity.map((a, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: "var(--radius-full)",
                                    background: a.type === "grade" ? "var(--primary-100)" : a.type === "attendance" ? "var(--success-light)" : a.type === "exam" ? "var(--purple-light)" : "var(--warning-light)",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    color: a.type === "grade" ? "var(--primary-600)" : a.type === "attendance" ? "var(--success)" : a.type === "exam" ? "var(--purple)" : "var(--warning)",
                                }}>
                                    {a.type === "grade" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
                                    {a.type === "attendance" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    {a.type === "exam" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
                                    {a.type === "notification" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{a.action}</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{a.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
