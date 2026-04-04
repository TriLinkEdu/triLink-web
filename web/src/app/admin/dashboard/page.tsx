"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Megaphone,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { adminAnalytics, adminDashboard } from "@/lib/admin-api";

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
        {Array.from({ length: 6 }).map((_, i) => (
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

      <div className="content-grid admin-dash-bottom-grid" style={{ marginTop: "1.5rem" }}>
        {Array.from({ length: 2 }).map((_, cardIndex) => (
          <div className="card admin-dash-bottom-card admin-dash-skeleton-block" key={cardIndex}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="admin-skeleton shimmer" style={{ width: 210, height: 20 }} />
              <div className="admin-skeleton shimmer" style={{ width: 95, height: 28, borderRadius: 999 }} />
            </div>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {Array.from({ length: 4 }).map((_, row) => (
                <div className="admin-skeleton shimmer" style={{ width: "100%", height: 42, borderRadius: 10 }} key={row} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dash, setDash] = useState<Awaited<ReturnType<typeof adminDashboard>> | null>(null);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof adminAnalytics>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, a] = await Promise.all([adminDashboard(), adminAnalytics()]);
        if (!cancelled) {
          setDash(d);
          setAnalytics(a);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div className="page-wrapper">
        <div className="card" style={{ padding: "1.5rem", color: "var(--danger)" }}>
          {err}
        </div>
      </div>
    );
  }

  if (!dash || !analytics) {
    return <DashboardSkeleton />;
  }

  const attendanceRatePct =
    analytics.attendance.presentRateLast30DaysApprox != null
      ? Math.round(analytics.attendance.presentRateLast30DaysApprox * 100)
      : null;

  const stats = [
    {
      label: "Students",
      value: String(dash.users.student),
      icon: GraduationCap,
      tone: "blue",
      note: "Active learners",
    },
    {
      label: "Teachers",
      value: String(dash.users.teacher),
      icon: BookOpen,
      tone: "green",
      note: "Faculty members",
    },
    {
      label: "Parents",
      value: String(dash.users.parent),
      icon: Users,
      tone: "purple",
      note: "Linked guardians",
    },
    {
      label: "Class offerings",
      value: String(dash.classes),
      icon: School,
      tone: "orange",
      note: "Running classes",
    },
    {
      label: "Enrollments",
      value: String(dash.enrollments),
      icon: ClipboardList,
      tone: "blue",
      note: "Current registrations",
    },
    {
      label: "Attendance (30d)",
      value: attendanceRatePct != null ? `${attendanceRatePct}%` : "—",
      icon: CheckCircle2,
      tone: "teal",
      note: `${analytics.attendance.marksRecordedLast30Days} marks logged`,
    },
  ];

  const feedbackTotal = analytics.feedbackTicketsByStatus.reduce((total, item) => total + item.count, 0);

  return (
    <div className="page-wrapper">
      <div className="admin-dash-hero">
        <div>
          <p className="admin-dash-kicker">
            <Sparkles size={14} />
            Command Center
          </p>
          <h1 className="admin-dash-title">School overview</h1>
          <p className="admin-dash-subtitle">Snapshot updated {new Date(analytics.generatedAt).toLocaleString()}</p>
        </div>
        <div className="admin-dash-pill">
          <ShieldCheck size={16} />
          Admin view
        </div>
      </div>

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
            <h3 className="card-title admin-dash-bottom-title">Exams, release, and reach</h3>
            <div className="admin-dash-chip">
              <Activity size={14} />
              Academic pulse
            </div>
          </div>
          <div className="admin-dash-metric-list">
            <div className="admin-dash-metric-item">
              <span>Published exams</span>
              <strong>{analytics.exams.publishedCount}</strong>
            </div>
            <div className="admin-dash-metric-item">
              <span>Attempts submitted</span>
              <strong>{analytics.examAttempts.submitted}</strong>
            </div>
            <div className="admin-dash-metric-item">
              <span>Results released</span>
              <strong>{analytics.examAttempts.released}</strong>
            </div>
            <div className="admin-dash-metric-item">
              <span>Announcements sent</span>
              <strong>{analytics.announcementsTotal}</strong>
            </div>
          </div>
        </div>
        <div className="card admin-dash-bottom-card">
          <div className="admin-dash-bottom-head">
            <h3 className="card-title admin-dash-bottom-title">Feedback tickets by status</h3>
            <div className="admin-dash-chip">
              <Megaphone size={14} />
              Total {feedbackTotal}
            </div>
          </div>
          {analytics.feedbackTicketsByStatus.length === 0 ? (
            <p style={{ color: "var(--gray-500)" }}>No feedback yet.</p>
          ) : (
            <ul className="admin-dash-feedback-list">
              {analytics.feedbackTicketsByStatus.map((f) => (
                <li key={f.status} className="admin-dash-feedback-item">
                  <div className="admin-dash-feedback-row">
                    <strong>{f.status}</strong>
                    <span>{f.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${feedbackTotal > 0 ? (f.count / feedbackTotal) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
