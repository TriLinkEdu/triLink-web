"use client";
import { useState } from "react";
import { useAttendanceStore } from "@/store/attendanceStore";

export default function AdminClasses() {
    const { classes, addClass, studentsByClass } = useAttendanceStore();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", teacher: "", room: "" });
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const handleCreate = () => {
        if (!form.name.trim() || !form.teacher.trim() || !form.room.trim()) {
            showToast("Please fill in all fields.");
            return;
        }
        if (classes.find(c => c.name.toLowerCase() === form.name.trim().toLowerCase())) {
            showToast("A class with that name already exists.");
            return;
        }
        addClass({ name: form.name.trim(), teacher: form.teacher.trim(), room: form.room.trim() });
        setForm({ name: "", teacher: "", room: "" });
        setShowModal(false);
        showToast(`Class "${form.name.trim()}" created successfully!`);
    };

    return (
        <div className="page-wrapper">
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#fff", borderRadius: 14, padding: "1rem 1.5rem", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1.5px solid var(--success)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--success-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast}</span>
                </div>
            )}

            {/* Create Class Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 460, boxShadow: "0 25px 60px rgba(0,0,0,0.22)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Create New Class</h2>
                            <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--gray-200)", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--gray-500)" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Class Name</label>
                            <div className="input-field">
                                <input placeholder="e.g. Grade 10-C" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Homeroom Teacher</label>
                            <div className="input-field">
                                <input placeholder="e.g. Mr. Solomon" value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: "1.5rem" }}>
                            <label>Room</label>
                            <div className="input-field">
                                <input placeholder="e.g. Room 303" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Create Class</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <div><h1 className="page-title">Class Management</h1><p className="page-subtitle">Create classes and assign teachers</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Class</button>
            </div>
            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Class</th><th>Homeroom Teacher</th><th>Students</th><th>Room</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {classes.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                                    <td>{c.teacher}</td>
                                    <td>{studentsByClass[c.name]?.length ?? 0}</td>
                                    <td>{c.room}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "0.375rem" }}>
                                            <button className="btn btn-outline btn-sm">Edit</button>
                                            <button className="btn btn-secondary btn-sm">Assign Teacher</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

