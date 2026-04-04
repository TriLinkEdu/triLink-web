"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Building2, Search, Sparkles, Users } from "lucide-react";
import { type PublicUser, listUsers } from "@/lib/admin-api";

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

      <div className="card teachers-panel" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)", minWidth: 220 }}
        />
        <button type="button" className="btn btn-secondary" onClick={load}>
          <Search size={14} />
          Search
        </button>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      <div className="card teachers-panel">
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
                rows.map((t) => (
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
