"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Admin · Command Center — 1:1 port of the TRILINK kit's `<AdminDashboard/>`
 * (`portals.jsx` lines 21–195). All visual structure, copy, and prop shape
 * are preserved from the kit; the only adaptation is wiring the data to our
 * real backend (`adminDashboard()` + `adminAnalytics()`) instead of the kit's
 * sample arrays.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    adminAnalytics,
    adminDashboard,
    listAuditLogs,
    getActiveAcademicYear,
} from "@/lib/admin-api";
import {
    ActivityRow,
    Icon,
    PageHead,
    Pill,
    StatGrid,
    StatTile,
    type PillKind,
} from "@/components/kit";
import { KitDialog } from "@/components/kit/local";
import { useShellData } from "@/components/kit/ShellDataContext";

type Tone = "neutral" | "active" | "pending" | "danger" | "brand";

function ticketTone(status: string): Tone {
    const s = status.toLowerCase();
    if (s.includes("open") || s.includes("new") || s.includes("urgent")) return "danger";
    if (s.includes("review") || s.includes("progress") || s.includes("pending")) return "pending";
    if (s.includes("resolv") || s.includes("close") || s.includes("done")) return "active";
    return "neutral";
}

type AuditRow = {
    id: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    diffJson?: string | null;
    createdAt: string;
};

function relTime(iso: string): string {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const s = Math.round(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}

function iconForAction(action: string): "edit" | "users" | "megaphone" | "alert" | "lock" | "check" | "history" {
    const a = action.toLowerCase();
    if (a.includes("login") || a.includes("auth")) return "lock";
    if (a.includes("enroll") || a.includes("user")) return "users";
    if (a.includes("announce")) return "megaphone";
    if (a.includes("attendance")) return "check";
    if (a.includes("delete") || a.includes("alert")) return "alert";
    if (a.includes("create") || a.includes("update") || a.includes("patch")) return "edit";
    return "history";
}

function pillForAction(action: string): { kind: PillKind; label: string } {
    const a = action.toLowerCase();
    if (a.includes("create")) return { kind: "active", label: "Created" };
    if (a.includes("delete")) return { kind: "danger", label: "Deleted" };
    if (a.includes("update") || a.includes("patch")) return { kind: "brand", label: "Updated" };
    if (a.includes("login")) return { kind: "neutral", label: "Login" };
    return { kind: "neutral", label: "Logged" };
}

function humanizeAction(action: string): string {
    const tail = action.split(".").pop() ?? action;
    return tail.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function humanizeEntity(entity: string): string {
    return entity.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default function AdminDashboardPage() {
    const shell = useShellData();
    const [dash, setDash] = useState<Awaited<ReturnType<typeof adminDashboard>> | null>(null);
    const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof adminAnalytics>> | null>(null);
    const [audit, setAudit] = useState<AuditRow[]>([]);
    const [yearLabel, setYearLabel] = useState<string>("");
    const [err, setErr] = useState<string | null>(null);
    const [time, setTime] = useState(new Date());
    const [createOpen, setCreateOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const [d, a, logs, yr] = await Promise.all([
                    adminDashboard(),
                    adminAnalytics(),
                    listAuditLogs(5),
                    getActiveAcademicYear(),
                ]);
                if (!cancelled) {
                    setDash(d);
                    setAnalytics(a);
                    setAudit(Array.isArray(logs) ? (logs as AuditRow[]) : []);
                    setYearLabel(yr?.label ?? "");
                }
            } catch (e) {
                if (!cancelled) {
                    setErr(e instanceof Error ? e.message : "Failed to load dashboard");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const onExport = useMemo(
        () => async () => {
            if (!analytics) return;
            setExporting(true);
            try {
                const lines: string[] = [];
                lines.push("Metric,Value");
                lines.push(`Students,${dash?.users.student ?? 0}`);
                lines.push(`Teachers,${dash?.users.teacher ?? 0}`);
                lines.push(`Parents,${dash?.users.parent ?? 0}`);
                lines.push(`Class offerings,${dash?.classes ?? 0}`);
                lines.push(`Enrollments,${dash?.enrollments ?? 0}`);
                lines.push(`Published exams,${analytics.exams.publishedCount}`);
                lines.push(`Submitted attempts,${analytics.examAttempts.submitted}`);
                lines.push(`Released attempts,${analytics.examAttempts.released}`);
                lines.push(`Announcements total,${analytics.announcementsTotal}`);
                lines.push(
                    `Attendance present rate 30d,${
                        analytics.attendance.presentRateLast30DaysApprox ?? ""
                    }`,
                );
                const blob = new Blob([lines.join("\n")], { type: "text/csv" });
                const u = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = u;
                a.download = `trilink-overview-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(u);
            } finally {
                setExporting(false);
            }
        },
        [analytics, dash],
    );

    if (err) {
        return (
            <div className="kit-page" data-role="admin">
                <div
                    role="alert"
                    className="rounded-[12px] border bg-[var(--color-danger-soft)] px-4 py-3 text-[13px] text-[var(--color-danger)]"
                    style={{ borderColor: "rgba(196,53,84,0.18)" }}
                >
                    {err}
                </div>
            </div>
        );
    }

    if (!dash || !analytics) {
        return (
            <div className="kit-page" data-role="admin">
                <div className="phead">
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="phead__meta">
                            <span className="role-dot" />
                            Loading school overview&hellip;
                        </div>
                        <div className="skel" style={{ height: 24, width: 220, marginTop: 4 }} />
                    </div>
                </div>
                <div className="stat-grid cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="stat">
                            <div className="skel" style={{ height: 12, width: 80 }} />
                            <div className="skel" style={{ height: 24, width: 90 }} />
                            <div className="skel" style={{ height: 11, width: 110 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const attendanceRatePct =
        analytics.attendance.presentRateLast30DaysApprox != null
            ? Math.round(analytics.attendance.presentRateLast30DaysApprox * 100)
            : null;

    /* === STATS — kit copy (`portals.jsx` lines 29–36) bound to live data === */
    const stats = [
        { icon: "users",   label: "Students",          value: String(dash.users.student), note: "active learners" },
        { icon: "edit",    label: "Teachers",          value: String(dash.users.teacher), note: "faculty members" },
        { icon: "family",  label: "Parents linked",    value: String(dash.users.parent),  note: "of student base" },
        { icon: "layers",  label: "Class offerings",   value: String(dash.classes),       note: "term" },
        { icon: "package", label: "Enrollments",       value: String(dash.enrollments),   note: "current" },
        {
            icon: "check",
            label: "Attendance · 30d",
            value: attendanceRatePct != null ? `${attendanceRatePct}%` : "—",
            note: `${analytics.attendance.marksRecordedLast30Days} marks logged`,
        },
    ] as const;

    /* === FEEDBACK TICKETS — kit's "Feedback tickets · by status" card === */
    const feedbackTotal = analytics.feedbackTicketsByStatus.reduce(
        (total, item) => total + item.count,
        0,
    );
    const topOpenCategory =
        analytics.feedbackTicketsByStatus
            .filter((t) => /open|new|pending|review/.test(t.status.toLowerCase()))
            .sort((a, b) => b.count - a.count)[0] ?? null;

    return (
        <div className="kit-page" data-role="admin">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        {shell.schoolName}
                        {yearLabel ? <> · {yearLabel}</> : null}
                        <span className="dot-sep">·</span>
                        <span className="live-chip">Live · {timeStr}</span>
                    </>
                }
                title="Command center"
                sub="Everything happening across the school today."
                actions={
                    <>
                        <button
                            type="button"
                            className="btn-kit btn-kit-secondary"
                            onClick={onExport}
                            disabled={exporting}
                        >
                            <Icon name="download" /> {exporting ? "Exporting…" : "Export"}
                        </button>
                        <button
                            type="button"
                            className="btn-kit btn-kit-primary"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Icon name="plus" /> Create
                        </button>
                    </>
                }
            />

            <StatGrid cols={6} className="!mb-[14px]">
                {stats.map((s) => (
                    <StatTile
                        key={s.label}
                        icon={s.icon}
                        label={s.label}
                        value={s.value}
                        note={s.note}
                    />
                ))}
            </StatGrid>

            <div className="grid-2">
                {/* Exams · release & reach */}
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Exams · release &amp; reach</div>
                            <div className="k-card__sub">Across all class offerings, last 14 days</div>
                        </div>
                        <button type="button" className="btn-kit btn-kit-ghost">
                            View all <Icon name="chev" size={11} />
                        </button>
                    </div>
                    <div style={{ padding: "4px 0" }}>
                        {[
                            { name: "Exam reach snapshot",   grade: "Aggregated across grades",   metric: `${analytics.exams.publishedCount} published`, status: "active" as PillKind, statusLabel: "Live" },
                            { name: "Attempts submitted",    grade: "Across all class offerings", metric: `${analytics.examAttempts.submitted} submitted`, status: "neutral" as PillKind, statusLabel: "Tracked" },
                            { name: "Results released",      grade: "Auto-released to students",  metric: `${analytics.examAttempts.released} released`,  status: "active" as PillKind, statusLabel: "Released" },
                            { name: "Announcements sent",    grade: "Reach across portals",       metric: `${analytics.announcementsTotal} broadcast`,   status: "neutral" as PillKind, statusLabel: "Sent" },
                        ].map((e) => (
                            <div
                                key={e.name}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 220px 110px",
                                    gap: 14,
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    borderBottom: "1px solid var(--hairline)",
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                                        {e.name}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                                        {e.grade}
                                    </div>
                                </div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)" }}>
                                    {e.metric}
                                </div>
                                <div>
                                    <Pill kind={e.status}>{e.statusLabel}</Pill>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback tickets · by status — exact kit copy and structure */}
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Feedback tickets · by status</div>
                            <div className="k-card__sub">{feedbackTotal} tickets this week</div>
                        </div>
                        <Pill kind="brand">+{feedbackTotal} this week</Pill>
                    </div>
                    <div className="k-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {analytics.feedbackTicketsByStatus.length === 0 ? (
                            <div className="empty-card">
                                <Icon name="inbox" size={28} />
                                <div className="empty-card__t">No feedback yet</div>
                                <div className="empty-card__b">
                                    Tickets submitted via the feedback channel will appear here.
                                </div>
                            </div>
                        ) : (
                            analytics.feedbackTicketsByStatus.map((t) => {
                                const pct = feedbackTotal > 0 ? Math.round((t.count / feedbackTotal) * 100) : 0;
                                const tone = ticketTone(t.status);
                                return (
                                    <div key={t.status}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 400, textTransform: "capitalize" }}>
                                                {t.status}
                                            </span>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-3)" }}>
                                                {t.count}
                                                <span style={{ color: "var(--ink-4)" }}>/{feedbackTotal}</span>
                                            </span>
                                        </div>
                                        <div className="k-bar">
                                            <div
                                                className={`k-bar__fill k-bar__fill--${tone === "active" ? "success" : tone === "pending" ? "warning" : tone === "danger" ? "danger" : "brand"}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {topOpenCategory ? (
                            <div
                                style={{
                                    marginTop: 6,
                                    padding: "12px 14px",
                                    background: "var(--brand-faint)",
                                    borderRadius: 8,
                                    border: "1px solid rgba(91,91,214,0.12)",
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "flex-start",
                                }}
                            >
                                <Icon name="sparkles" size={14} />
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "var(--ink-2)",
                                        lineHeight: 1.55,
                                        flex: 1,
                                    }}
                                >
                                    <span style={{ color: "var(--brand-ink)", fontWeight: 500 }}>
                                        Top open status ·{" "}
                                    </span>
                                    <span style={{ textTransform: "capitalize" }}>
                                        {topOpenCategory.status}
                                    </span>{" "}
                                    has {topOpenCategory.count}{" "}
                                    {topOpenCategory.count === 1 ? "ticket" : "tickets"} awaiting
                                    triage.
                                    <Link
                                        href="/admin/feedback"
                                        style={{
                                            marginLeft: 8,
                                            color: "var(--brand-ink)",
                                            fontWeight: 500,
                                            fontSize: 12,
                                        }}
                                    >
                                        Review &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Audit log — real backend data (last 5 events) */}
            <div className="k-card" style={{ marginTop: 14 }}>
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">Audit log</div>
                        <div className="k-card__sub">
                            Read-only · last {audit.length} {audit.length === 1 ? "event" : "events"}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <Link href="/admin/audit" className="btn-kit btn-kit-ghost">
                            <Icon name="history" /> Full log
                        </Link>
                    </div>
                </div>
                <div style={{ padding: "6px 8px 8px" }}>
                    {audit.length === 0 ? (
                        <div className="empty-card">
                            <Icon name="history" size={28} />
                            <div className="empty-card__t">No recent activity</div>
                            <div className="empty-card__b">
                                Admin actions across the school will appear here.
                            </div>
                        </div>
                    ) : (
                        audit.map((row) => {
                            const pill = pillForAction(row.action);
                            return (
                                <ActivityRow
                                    key={row.id}
                                    icon={iconForAction(row.action)}
                                    title={humanizeAction(row.action)}
                                    detail={`${humanizeEntity(row.entityType)}${
                                        row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""
                                    }`}
                                    type={humanizeEntity(row.entityType)}
                                    status={<Pill kind={pill.kind}>{pill.label}</Pill>}
                                    date={relTime(row.createdAt)}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {createOpen && (
                <KitDialog title="Create" onClose={() => setCreateOpen(false)} maxWidth={380}>
                    <div style={{ display: "grid", gap: 8 }}>
                        <Link
                            href="/admin/registration"
                            className="k-card"
                            onClick={() => setCreateOpen(false)}
                            style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}
                        >
                            <Icon name="users" />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>New user</div>
                                <div style={{ fontSize: 11.5, color: "var(--color-ink-mute)" }}>
                                    Register student, teacher, or parent
                                </div>
                            </div>
                        </Link>
                        <Link
                            href="/admin/classes"
                            className="k-card"
                            onClick={() => setCreateOpen(false)}
                            style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}
                        >
                            <Icon name="layers" />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>New class</div>
                                <div style={{ fontSize: 11.5, color: "var(--color-ink-mute)" }}>
                                    Create a new class offering
                                </div>
                            </div>
                        </Link>
                        <Link
                            href="/admin/announcements"
                            className="k-card"
                            onClick={() => setCreateOpen(false)}
                            style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}
                        >
                            <Icon name="megaphone" />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>New announcement</div>
                                <div style={{ fontSize: 11.5, color: "var(--color-ink-mute)" }}>
                                    Broadcast to students, parents, or staff
                                </div>
                            </div>
                        </Link>
                    </div>
                </KitDialog>
            )}
        </div>
    );
}
