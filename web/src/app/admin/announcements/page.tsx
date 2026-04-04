"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarDays, Megaphone, RefreshCcw, Sparkles, Users } from "lucide-react";
import { type AcademicYear, type Announcement, createAnnouncement, deleteAnnouncement, getActiveAcademicYear, listAnnouncements } from "@/lib/admin-api";

const AUDIENCES = ["all", "students", "teachers", "parents"];

function AnnouncementsSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="announcements-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div className="admin-skeleton shimmer" style={{ width: 160, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "80%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "64%", height: 14 }} />
        </div>
      </div>
      <div className="announcements-summary-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="card announcements-summary-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "55%", height: 12, marginBottom: 8 }} />
            <div className="admin-skeleton shimmer" style={{ width: "35%", height: 22 }} />
          </div>
        ))}
      </div>
      <div className="card admin-dash-skeleton-block" style={{ marginBottom: "1rem" }}>
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 220, borderRadius: 12 }} />
      </div>
      <div className="card admin-dash-skeleton-block">
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 230, borderRadius: 12 }} />
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [rows, setRows] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const active = await getActiveAcademicYear();
      setYear(active);
      if (active) setRows(await listAnnouncements(active.id));
      else setRows(await listAnnouncements());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async () => {
    if (!year) {
      setToast("No active academic year — set one under Settings or Classes.");
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (!title.trim() || !body.trim()) {
      setToast("Title and body required");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    try {
      await createAnnouncement({
        academicYearId: year.id,
        title: title.trim(),
        body: body.trim(),
        audience,
      });
      setTitle("");
      setBody("");
      await load();
      setToast("Published");
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    try {
      await deleteAnnouncement(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const audienceStats = {
    all: rows.filter((r) => r.audience === "all").length,
    scoped: rows.filter((r) => r.audience !== "all").length,
  };

  if (loading && rows.length === 0) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <div className="page-wrapper">
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 9999, background: "#fff", padding: "0.75rem 1rem", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontWeight: 600 }}>
          {toast}
        </div>
      )}
      <div className="announcements-hero">
        <div>
          <p className="announcements-kicker">
            <Sparkles size={14} />
            Broadcast Center
          </p>
          <h1 className="announcements-title">Announcements</h1>
          <p className="announcements-subtitle">Broadcast messages to students, teachers, or parents</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load}>
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="announcements-summary-grid">
        <div className="card announcements-summary-card">
          <div className="announcements-summary-icon blue">
            <Megaphone size={18} />
          </div>
          <div className="announcements-summary-label">Total posts</div>
          <div className="announcements-summary-value">{rows.length}</div>
        </div>
        <div className="card announcements-summary-card">
          <div className="announcements-summary-icon teal">
            <Users size={18} />
          </div>
          <div className="announcements-summary-label">Audience-wide</div>
          <div className="announcements-summary-value">{audienceStats.all}</div>
        </div>
        <div className="card announcements-summary-card">
          <div className="announcements-summary-icon orange">
            <CalendarDays size={18} />
          </div>
          <div className="announcements-summary-label">Scoped messages</div>
          <div className="announcements-summary-value">{audienceStats.scoped}</div>
        </div>
      </div>

      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      <div className="card announcements-panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title announcements-section-title" style={{ marginBottom: "1rem" }}>
          <BellRing size={16} />
          New announcement
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "1rem" }}>
          Posting into: {year ? <strong>{year.label}</strong> : "no active year — choose one under Settings first"}
        </p>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
          <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
          <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ padding: "0.5rem", maxWidth: 200 }}>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={publish} disabled={loading}>
            Publish
          </button>
        </div>
      </div>
      <div className="card announcements-panel">
        <h3 className="card-title announcements-section-title" style={{ marginBottom: "1rem" }}>
          All (filtered by year when active)
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Audience</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--gray-500)" }}>
                    No announcements.
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td>{a.audience}</td>
                    <td style={{ fontSize: "0.8rem" }}>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => del(a.id)}>
                        Delete
                      </button>
                    </td>
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
