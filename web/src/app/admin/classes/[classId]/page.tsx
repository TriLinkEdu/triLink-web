"use client";
import { useParams, useRouter } from "next/navigation";
import { useAttendanceStore } from "@/store/attendanceStore";

export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const { classes, studentsByClass } = useAttendanceStore();

    const classInfo = classes.find((c) => c.id === classId);

    if (!classInfo) {
        return (
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Class Not Found</h1>
                </div>
                <div className="card">
                    <p style={{ color: "var(--gray-500)", textAlign: "center", padding: "2rem" }}>
                        The class you're looking for doesn't exist.
                    </p>
                    <div style={{ textAlign: "center" }}>
                        <button className="btn btn-primary" onClick={() => router.push("/admin/classes")}>
                            Back to Classes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const students = studentsByClass[classInfo.name] ?? [];

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <button
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--blue-600)",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                        }}
                        onClick={() => router.push("/admin/classes")}
                    >
                        ← Back to Classes
                    </button>
                    <h1 className="page-title">{classInfo.name}</h1>
                    <p className="page-subtitle">Class Details and Student Management</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(250px, 1fr)", gap: "1.5rem" }}>
                {/* Class Information */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: "1.5rem" }}>Class Information</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontWeight: 600, marginBottom: "0.35rem" }}>
                                Class Name
                            </div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>
                                {classInfo.name}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontWeight: 600, marginBottom: "0.35rem" }}>
                                Room
                            </div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>
                                {classInfo.room}
                            </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontWeight: 600, marginBottom: "0.35rem" }}>
                                Homeroom Teacher
                            </div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>
                                {classInfo.teacher}
                            </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontWeight: 600, marginBottom: "0.35rem" }}>
                                Total Students
                            </div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>
                                {students.length}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--gray-200)" }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => router.push("/admin/classes")}
                            style={{ width: "100%" }}
                        >
                            Edit Class
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>Overview</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ padding: "0.75rem", background: "var(--blue-50)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--blue-600)", fontWeight: 700 }}>STUDENTS</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--blue-700)", marginTop: "0.25rem" }}>
                                {students.length}
                            </div>
                        </div>
                        <div style={{ padding: "0.75rem", background: "var(--purple-50)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--purple-600)", fontWeight: 700 }}>TEACHER</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--purple-700)", marginTop: "0.25rem" }}>
                                {classInfo.teacher}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="card" style={{ marginTop: "1.5rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                    <h3 className="card-title">Students ({students.length})</h3>
                </div>
                {students.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Student ID</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td style={{ fontWeight: 500 }}>{student.name}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "var(--gray-500)" }}>
                                            {student.id}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => alert(`View details for ${student.name}`)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--gray-400)" }}>
                        No students enrolled in this class yet.
                    </div>
                )}
            </div>
        </div>
    );
}
