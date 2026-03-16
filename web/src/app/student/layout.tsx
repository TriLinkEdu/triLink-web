"use client";
import { usePathname } from "next/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Exam session has its own full-screen layout (no sidebar/header)
    if (pathname.startsWith("/student/exam/")) {
        return <>{children}</>;
    }

    // Login page - no layout
    if (pathname === "/student/login") {
        return <>{children}</>;
    }

    // Dashboard (exam list) + result pages - minimal header
    return (
        <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
            <header className="student-header">
                <div className="student-header-brand">
                    <div style={{
                        width: 36, height: 36,
                        background: "linear-gradient(135deg, var(--primary-500), var(--primary-700))",
                        borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 900, fontSize: "1rem"
                    }}>△</div>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--gray-900)" }}>
                        TriLink <span style={{ fontWeight: 400, color: "var(--gray-400)" }}>|</span> <span style={{ fontWeight: 500, color: "var(--primary-600)", fontSize: "0.9rem" }}>Exam Portal</span>
                    </span>
                </div>
                <div className="student-header-user">
                    <a href="/student/dashboard" style={{
                        padding: "0.35rem 0.7rem", borderRadius: "8px",
                        background: pathname === "/student/dashboard" ? "var(--primary-50)" : "transparent",
                        color: pathname === "/student/dashboard" ? "var(--primary-600)" : "var(--gray-600)",
                        fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
                        border: "1px solid transparent",
                    }}>Exams</a>
                    <div className="student-header-user-info">
                        <div style={{
                            width: 34, height: 34, borderRadius: "10px",
                            background: "var(--primary-50)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-600)"
                        }}>AK</div>
                        <div className="student-header-user-details">
                            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Abebe Kebede</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>Grade 11-A</div>
                        </div>
                    </div>
                    <a href="/student/login" style={{
                        padding: "0.4rem 0.75rem", borderRadius: "8px",
                        background: "var(--danger-light)", color: "#991b1b",
                        fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
                        border: "1px solid rgba(239,68,68,0.2)"
                    }}>Logout</a>
                </div>
            </header>
            <main className="student-main">
                {children}
            </main>
        </div>
    );
}
