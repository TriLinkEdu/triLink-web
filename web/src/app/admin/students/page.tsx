"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap, Layers3, Search, Sparkles, Users } from "lucide-react";
import { type PublicUser, listUsers } from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";

function StudentsSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="students-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div className="admin-skeleton shimmer" style={{ width: 140, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "80%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "64%", height: 14 }} />
        </div>
      </div>
      <div className="students-summary-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="card students-summary-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "55%", height: 12, marginBottom: 8 }} />
            <div className="admin-skeleton shimmer" style={{ width: "35%", height: 22 }} />
          </div>
        ))}
      </div>
      <div className="card admin-dash-skeleton-block">
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 240, borderRadius: 12 }} />
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const [rows, setRows] = useState<PublicUser[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listUsers("student", q.trim() || undefined);
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search on demand
  }, []);

  const withGrade = rows.filter((s) => !!s.grade).length;
  const withSection = rows.filter((s) => !!s.section).length;

  
  const total = rows.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = rows.slice(startIdx, endIdx);


  if (loading && rows.length === 0) {
    return <StudentsSkeleton />;
  }

  return (
    <div className="page-wrapper">
      <div className="students-hero">
        <div>
          <p className="students-kicker">
            <Sparkles size={14} />
            Learner Directory
          </p>
          <h1 className="students-title">Students</h1>
          <p className="students-subtitle">Directory of enrolled students</p>
        </div>
        <Link href="/admin/registration" className="btn btn-primary">
          + Register
        </Link>
      </div>

      <div className="students-summary-grid">
        <div className="card students-summary-card">
          <div className="students-summary-icon blue">
            <Users size={18} />
          </div>
          <div className="students-summary-label">Total students</div>
          <div className="students-summary-value">{rows.length}</div>
        </div>
        <div className="card students-summary-card">
          <div className="students-summary-icon teal">
            <GraduationCap size={18} />
          </div>
          <div className="students-summary-label">With grade</div>
          <div className="students-summary-value">{withGrade}</div>
        </div>
        <div className="card students-summary-card">
          <div className="students-summary-icon orange">
            <Layers3 size={18} />
          </div>
          <div className="students-summary-label">With section</div>
          <div className="students-summary-value">{withSection}</div>
        </div>
      </div>

      <div className="card students-panel" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)", minWidth: 220 }}
        />
        <button type="button" className="btn btn-secondary" onClick={load}>
          <Search size={14} />
          Search
        </button>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      <div className="card students-panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--gray-500)" }}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--gray-500)" }}>
                    No students.
                  </td>
                </tr>
              ) : (
                visibleRows.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>
                      {s.firstName} {s.lastName}
                    </td>
                    <td>{s.email}</td>
                    <td>{s.grade ?? "—"}</td>
                    <td>{s.section ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
