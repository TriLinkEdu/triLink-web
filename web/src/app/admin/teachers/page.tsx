"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Building2, Search, Sparkles, Users } from "lucide-react";
import { type PublicUser, listUsers } from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";

function TeachersSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="teachers-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div className="admin-skeleton shimmer" style={{ width: 140, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "80%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "64%", height: 14 }} />
        </div>
      </div>
      <div className="teachers-summary-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="card teachers-summary-card admin-dash-skeleton-block" key={i}>
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

export default function AdminTeachers() {
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
      setRows(await listUsers("teacher", q.trim() || undefined));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withSubject = rows.filter((t) => !!t.subject).length;
  const withDepartment = rows.filter((t) => !!t.department).length;

  
  const total = rows.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = rows.slice(startIdx, endIdx);


  if (loading && rows.length === 0) {
    return <TeachersSkeleton />;
  }

  return (
    <div className="page-wrapper">
      <div className="teachers-hero">
        <div>
          <p className="teachers-kicker">
            <Sparkles size={14} />
            Faculty Directory
          </p>
          <h1 className="teachers-title">Teachers</h1>
          <p className="teachers-subtitle">Teachers on staff</p>
        </div>
        <Link href="/admin/registration" className="btn btn-primary">
          + Register
        </Link>
      </div>

      <div className="teachers-summary-grid">
        <div className="card teachers-summary-card">
          <div className="teachers-summary-icon blue">
            <Users size={18} />
          </div>
          <div className="teachers-summary-label">Total teachers</div>
          <div className="teachers-summary-value">{rows.length}</div>
        </div>
        <div className="card teachers-summary-card">
          <div className="teachers-summary-icon teal">
            <BookOpen size={18} />
          </div>
          <div className="teachers-summary-label">With subject</div>
          <div className="teachers-summary-value">{withSubject}</div>
        </div>
        <div className="card teachers-summary-card">
          <div className="teachers-summary-icon orange">
            <Building2 size={18} />
          </div>
          <div className="teachers-summary-label">With department</div>
          <div className="teachers-summary-value">{withDepartment}</div>
        </div>
      </div>

      <div className="card" style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search faculty members..."
            style={{ 
                width: "100%", 
                padding: "0.65rem 1rem 0.65rem 2.5rem", 
                borderRadius: "12px", 
                border: "1px solid var(--gray-200)", 
                fontSize: "0.9rem",
                outline: "none",
                background: "var(--gray-50)",
                transition: "all 0.2s"
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--primary-300)", e.currentTarget.style.background = "#fff", e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.06)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--gray-200)", e.currentTarget.style.background = "var(--gray-50)", e.currentTarget.style.boxShadow = "none")}
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={load} style={{ height: "40px", borderRadius: "12px" }}>
            Search
        </button>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Department</th>
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
                  <td colSpan={4}>No teachers.</td>
                </tr>
              ) : (
                visibleRows.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>
                      {t.firstName} {t.lastName}
                    </td>
                    <td>{t.email}</td>
                    <td>{t.subject ?? "—"}</td>
                    <td>{t.department ?? "—"}</td>
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
