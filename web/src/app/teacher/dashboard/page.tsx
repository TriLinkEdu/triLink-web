"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  Activity, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  GraduationCap, 
  Layout, 
  Megaphone, 
  Sparkles, 
  Star, 
  Users 
} from "lucide-react";
import { getActiveAcademicYear, listAllClassOfferings as listOfferings, teacherDashboard, type ClassOffering } from "@/lib/admin-api";
import { useCurrentUser } from "@/lib/useCurrentUser";

function DashboardSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="admin-dash-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div className="admin-skeleton shimmer" style={{ height: 12, width: 140, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ height: 32, width: "90%", marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ height: 14, width: "70%" }} />
        </div>
        <div className="admin-skeleton shimmer" style={{ height: 32, width: 100, borderRadius: 999 }} />
      </div>

      <div className="stats-grid admin-dash-stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="stat-card admin-dash-stat-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 48, height: 48, borderRadius: 14 }} />
            <div style={{ flex: 1 }}>
              <div className="admin-skeleton shimmer" style={{ width: "60%", height: 12, marginBottom: 10 }} />
              <div className="admin-skeleton shimmer" style={{ width: "35%", height: 24, marginBottom: 10 }} />
              <div className="admin-skeleton shimmer" style={{ width: "55%", height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function offeringLabel(o: ClassOffering) {
  return o.displayName || o.name?.trim() || "Untitled Class";
}

export default function TeacherDashboard() {
  const user = useCurrentUser("teacher");
  const [dash, setDash] = useState<Awaited<ReturnType<typeof teacherDashboard>> | null>(null);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const [d, year] = await Promise.all([teacherDashboard(), getActiveAcademicYear()]);
      setDash(d);
      if (year?.id) {
        const mine = await listOfferings(year.id);
        // Only show teacher's own offerings in the dashboard list for relevance
        setOfferings(mine.filter(o => o.teacherId === user.id));
      } else {
        setOfferings([]);
      }
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !dash) return <DashboardSkeleton />;

  const stats = [
    {
      label: "My classes",
      value: String(dash.myClasses),
      icon: Layout,
      tone: "green",
      note: "Assigned this year",
    },
    {
      label: "Total Students",
      value: String(dash.totalStudents),
      icon: GraduationCap,
      tone: "blue",
      note: "Across all classes",
    },
    {
      label: "Attendance Rate",
      value: dash.attendanceRate != null ? `${Math.round(dash.attendanceRate * 100)}%` : "—",
      icon: CheckCircle2,
      tone: "teal",
      note: "Presence (last 30d)",
    },
    {
      label: "Pending Grading",
      value: String(dash.pendingGradingApprox),
      icon: Star,
      tone: "orange",
      note: "Submitted attempts",
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="admin-dash-hero">
        <div>
          <p className="admin-dash-kicker">
            <Sparkles size={14} />
            Academic Pulse
          </p>
          <h1 className="admin-dash-title">Good morning, {user.firstName || "Teacher"}! ☀️</h1>
          <p className="admin-dash-subtitle">Real-time overview of your classes and performance.</p>
        </div>
        <div className="admin-dash-pill">
          <Calendar size={16} />
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {loadErr && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--danger)" }}>
          {loadErr}
        </div>
      )}

      <div className="stats-grid admin-dash-stats-grid">
        {stats.map((s) => (
          <div className="stat-card admin-dash-stat-card" key={s.label}>
            <div className={`stat-icon admin-dash-stat-icon ${s.tone}`}>
              <s.icon size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-label admin-dash-stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="admin-dash-stat-note">{s.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid admin-dash-bottom-grid" style={{ marginTop: "1.5rem" }}>
        <div className="card admin-dash-bottom-card">
          <div className="admin-dash-bottom-head">
            <h3 className="card-title admin-dash-bottom-title">Performance & Engagement</h3>
            <div className="admin-dash-chip">
              <Activity size={14} />
              Current Status
            </div>
          </div>
          <div className="admin-dash-metric-list">
            <div className="admin-dash-metric-item">
              <span>Published Exams</span>
              <strong>{dash.publishedExams}</strong>
            </div>
            <div className="admin-dash-metric-item">
              <span>Announcements Sent</span>
              <strong>{dash.recentAnnouncements}</strong>
            </div>
            <div className="admin-dash-metric-item">
              <span>Unread Notifications</span>
              <strong style={{ color: dash.unreadNotifications > 0 ? "var(--primary-600)" : "inherit" }}>
                {dash.unreadNotifications}
              </strong>
            </div>
          </div>
        </div>

        <div className="card admin-dash-bottom-card">
          <div className="card-header">
            <h3 className="card-title">Your class offerings</h3>
            <Megaphone size={16} color="var(--gray-400)" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {offerings.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>
                No active offerings.
              </p>
            ) : (
              offerings.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.875rem",
                    background: "var(--gray-50)",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--primary-500)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{offeringLabel(c)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
