"use client";
/* eslint-disable react/forbid-dom-props -- kit ports keep inline styles for kit-specific tweaks. */

/**
 * Admin · Students — directory list, rebuilt with kit primitives.
 *
 * Replaces the legacy `<AdminStudentsPremiumPage/>` (pastel gradients,
 * 900-weight fonts, inline-styled cards) with a kit-faithful page:
 *  - `<PageHead>` hero with role-dot meta + 22 px title + 13 px sub + kit primary "Register" CTA
 *  - `<StatGrid cols={4}>` of `<StatTile>` (total / active / missing class / missing phone)
 *  - Kit filter toolbar (`.k-field` search input + `.btn-kit-secondary` Refresh)
 *  - `.gtable` data table with `.k-avatar` initials avatar and `<Pill>` status
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type PublicUser, listUsers } from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";
import {
    Icon,
    KAvatar,
    PageHead,
    Pill,
    StatGrid,
    StatTile,
} from "@/components/kit";
import { KitInput } from "@/components/kit/local";

type StudentRecord = PublicUser & {
    address?: string | null;
    cityState?: string | null;
    country?: string | null;
    dateOfBirth?: string | null;
    dob?: string | null;
    rollNumber?: string | null;
};

function initialsFor(s: PublicUser) {
    return `${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase() || "ST";
}
function fullName(s: PublicUser) {
    return `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "Unnamed";
}
function studentRoll(s: StudentRecord, i: number) {
    return s.rollNumber || `ST-${String(i + 1).padStart(4, "0")}`;
}
function studentClass(s: PublicUser) {
    return [s.grade, s.section].filter(Boolean).join(" · ") || "Unassigned";
}
function studentDob(s: StudentRecord) {
    const raw = s.dateOfBirth || s.dob;
    if (!raw) return "—";
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
        ? raw
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<PublicUser[]>([]);
    const [query, setQuery] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    async function load(search = query) {
        setLoading(true);
        setErr(null);
        try {
            const data = await listUsers("student", search.trim() || undefined);
            setStudents(data);
            setPage(0);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load students");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void load("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const total = students.length;
    const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
    const currentPage = Math.min(page, maxPage);
    const startIdx = currentPage * rowsPerPage;
    const visibleRows = students.slice(startIdx, startIdx + rowsPerPage);

    const stats = useMemo(() => {
        const placed = students.filter((s) => s.grade && s.section).length;
        const missingClass = students.length - placed;
        const missingPhone = students.filter((s) => !s.phone).length;
        return { placed, missingClass, missingPhone };
    }, [students]);

    return (
        <div className="kit-page" data-role="admin">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Student directory
                        <span className="dot-sep">·</span>
                        {total} record{total === 1 ? "" : "s"}
                    </>
                }
                title="Students"
                sub="Enrollment, class placement, and contact details."
                actions={
                    <Link href="/admin/registration" className="btn-kit btn-kit-primary">
                        <Icon name="plus" /> Register
                    </Link>
                }
            />

            <StatGrid cols={4} className="!mb-[14px]">
                <StatTile icon="users" label="Total students" value={String(total)} note="active records" />
                <StatTile icon="check" label="Class assigned" value={String(stats.placed)} note={`${total - stats.placed} pending`} />
                <StatTile icon="alertTri" label="No class" value={String(stats.missingClass)} note="needs placement" />
                <StatTile icon="bell" label="No phone" value={String(stats.missingPhone)} note="missing contact" />
            </StatGrid>

            {/* Search toolbar */}
            <div
                className="k-card"
                style={{
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 14,
                }}
            >
                <div style={{ position: "relative" }}>
                    <Icon
                        name="search"
                        size={13}
                        style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--ink-3)",
                            pointerEvents: "none",
                        }}
                    />
                    <KitInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void load()}
                        placeholder="Search by name, email, class, or roll number"
                        style={{ paddingLeft: 30 }}
                    />
                </div>
                <button
                    type="button"
                    className="btn-kit btn-kit-secondary"
                    onClick={() => void load()}
                >
                    <Icon name="search" /> Search
                </button>
                <button
                    type="button"
                    className="btn-kit btn-kit-ghost"
                    onClick={() => void load("")}
                    aria-label="Refresh"
                >
                    <Icon name="refresh" /> Refresh
                </button>
            </div>

            {err ? (
                <div
                    role="alert"
                    className="k-card"
                    style={{
                        padding: "10px 14px",
                        background: "var(--color-danger-soft)",
                        borderColor: "rgba(196,53,84,0.18)",
                        color: "var(--color-danger)",
                        fontSize: 12.5,
                        marginBottom: 14,
                    }}
                >
                    {err}
                </div>
            ) : null}

            <div className="k-card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="gtable">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Roll</th>
                            <th>Class</th>
                            <th>DOB</th>
                            <th>Phone</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && students.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "var(--ink-3)" }}>
                                    Loading students…
                                </td>
                            </tr>
                        ) : visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "var(--ink-3)" }}>
                                    No students found.
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((s, i) => {
                                const rec = s as StudentRecord;
                                const complete = Boolean(s.grade && s.section && s.phone);
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <KAvatar initials={initialsFor(s)} size="sm" />
                                                <div>
                                                    <div style={{ fontWeight: 500, color: "var(--ink)", fontSize: 13 }}>
                                                        {fullName(s)}
                                                    </div>
                                                    <div style={{ color: "var(--ink-3)", fontSize: 11.5, marginTop: 1 }}>
                                                        {s.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: "var(--font-mono)" }}>
                                            {studentRoll(rec, startIdx + i)}
                                        </td>
                                        <td>{studentClass(s)}</td>
                                        <td>{studentDob(rec)}</td>
                                        <td>{s.phone || "—"}</td>
                                        <td>
                                            <Pill kind={complete ? "active" : "pending"}>
                                                {complete ? "Active" : "Needs info"}
                                            </Pill>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <TablePagination
                    total={total}
                    page={currentPage}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setPage}
                    onRowsPerPageChange={(v) => {
                        setRowsPerPage(v);
                        setPage(0);
                    }}
                />
            </div>
        </div>
    );
}
