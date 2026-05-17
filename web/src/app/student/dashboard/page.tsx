"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Student · Dashboard — 1:1 port of the TRILINK kit's `<StudentDashboard/>`
 * (`portals.jsx` lines 403–562). Hero, stat grid, recent activity tabs, and
 * the right-rail "Progress · Term 2" + "Shortcuts" cards all reproduce the
 * kit's exact structure and copy.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { studentDashboard, announcementsForMe, type Announcement } from "@/lib/admin-api";
import {
    ActivityRow,
    Icon,
    PageHead,
    Pill,
    ProgressRing,
    StatGrid,
    StatTile,
    Tabs,
    type PillKind,
} from "@/components/kit";

type ActivityFilter = "all" | "exams" | "assignments" | "grades" | "announce";

export default function StudentDashboardPage() {
    const router = useRouter();
    const user = useCurrentUser("student");
    const [dash, setDash] = useState<Awaited<ReturnType<typeof studentDashboard>> | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityFilter>("all");

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const [d, anns] = await Promise.all([
                    studentDashboard(),
                    announcementsForMe().catch(() => []),
                ]);
                if (!cancelled) {
                    setDash(d);
                    setAnnouncements(anns);
                }
            } catch (e) {
                if (!cancelled) {
                    setErr(e instanceof Error ? e.message : "Failed to load dashboard");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (err) {
        return (
            <div className="kit-page" data-role="student">
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

    const firstName = user.firstName?.trim() || "there";
    const courses = dash?.activeEnrollments ?? 0;
    const unread = dash?.unreadNotifications ?? 0;

    /* === Build the kit's "Recent activity" row stream from announcements
           and add a couple of canonical kit rows. Currently mocked-but-plausible
           until exams/assignments endpoints are wired. */
    const rows: ReadonlyArray<{
        icon: Parameters<typeof ActivityRow>[0]["icon"];
        title: string;
        detail: string;
        type: ActivityFilter | "AI";
        typeLabel: string;
        kind: PillKind;
        date: string;
        statusLabel: string;
        href?: string;
    }> = [
        {
            icon: "paper",
            title: "Mathematics · Practice Quiz",
            detail: "20 questions · 25 min · proctored",
            type: "exams",
            typeLabel: "Exam",
            kind: "danger",
            date: "Live",
            statusLabel: "Live now",
            href: "/student/exams",
        },
        ...announcements.slice(0, 2).map((a) => ({
            icon: "megaphone" as const,
            title: a.title,
            detail: a.body,
            type: "announce" as const,
            typeLabel: "Announce",
            kind: "brand" as PillKind,
            date: new Date(a.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
            statusLabel: "New",
            href: "/student/announcements",
        })),
        {
            icon: "file",
            title: "Lab report · awaiting grade",
            detail: "Submitted Mon · awaiting teacher review",
            type: "assignments",
            typeLabel: "Assignment",
            kind: "neutral",
            date: "Mon",
            statusLabel: "Submitted",
            href: "/student/assignments",
        },
        {
            icon: "trophy",
            title: "World History · Chapter 4 quiz",
            detail: "Score 88% · A−",
            type: "grades",
            typeLabel: "Grade",
            kind: "active",
            date: "Today",
            statusLabel: "Released",
            href: "/student/grades",
        },
        {
            icon: "sparkles",
            title: "AI tutor: try 'Derivatives intuition'",
            detail: "Suggested · mastery 38%",
            type: "AI",
            typeLabel: "AI",
            kind: "brand",
            date: "3 hr",
            statusLabel: "Recommended",
            href: "/student/learning-path",
        },
    ];

    const filterFn = (r: (typeof rows)[number]) => {
        if (filter === "all") return true;
        return r.type === filter;
    };

    return (
        <div className="kit-page" data-role="student">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        {user.grade ? `${user.grade}` : "Grade 11"} · AY {new Date().getFullYear()}
                        <span className="dot-sep">·</span>
                        14-day streak
                    </>
                }
                title={<>Welcome back, {firstName}.</>}
                sub={`You have ${rows.filter((r) => r.type === "exams").length} active exam and ${rows.filter((r) => r.type === "assignments").length} pending task. Let's keep going.`}
                actions={
                    <>
                        <button
                            type="button"
                            className="btn-kit btn-kit-secondary"
                            onClick={() => router.push("/student/calendar")}
                        >
                            <Icon name="cal" /> Today
                        </button>
                        <button
                            type="button"
                            className="btn-kit btn-kit-ai"
                            onClick={() => router.push("/student/learning-path")}
                        >
                            <Icon name="sparkles" /> Open AI tutor
                        </button>
                    </>
                }
            />

            <StatGrid cols={4} className="!mb-[14px]">
                <StatTile icon="book"  label="Active courses" value={String(courses)} note={courses > 0 ? "synced with school" : "no enrollments yet"} />
                <StatTile icon="paper" label="Open exams"     value="2" note="1 live now" />
                <StatTile icon="file"  label="Pending tasks"  value="3" note="next due in 2 days" />
                <StatTile icon="bell"  label="Unread alerts"  value={String(unread)} note={unread > 0 ? "tap to review" : "you're all caught up"} />
            </StatGrid>

            <div className="grid-12">
                {/* Recent activity */}
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Recent activity</div>
                            <div className="k-card__sub">Everything happening in your classes</div>
                        </div>
                        <Tabs
                            tabs={[
                                { id: "all",         label: "All",          count: rows.length },
                                { id: "exams",       label: "Exams",        count: rows.filter(r => r.type === "exams").length },
                                { id: "assignments", label: "Assignments",  count: rows.filter(r => r.type === "assignments").length },
                                { id: "grades",      label: "Grades" },
                                { id: "announce",    label: "Announcements" },
                            ]}
                            active={filter}
                            onChange={(id) => setFilter(id as ActivityFilter)}
                        />
                    </div>
                    <div style={{ padding: "6px 8px 8px" }}>
                        {rows.filter(filterFn).map((r, i) => (
                            <ActivityRow
                                key={`${r.title}-${i}`}
                                icon={r.icon}
                                title={r.title}
                                detail={r.detail}
                                type={r.typeLabel}
                                status={<Pill kind={r.kind}>{r.statusLabel}</Pill>}
                                date={r.date}
                                onClick={r.href ? () => router.push(r.href!) : undefined}
                            />
                        ))}
                        {rows.filter(filterFn).length === 0 ? (
                            <div className="empty-card">
                                <Icon name="inbox" size={28} />
                                <div className="empty-card__t">No activity yet</div>
                                <div className="empty-card__b">
                                    Items in this category will appear here as your teachers publish them.
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="section-stack">
                    {/* Progress · Term — kit's exact card structure */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">Progress · Term</div>
                                <div className="k-card__sub">Topics, exams, grades</div>
                            </div>
                        </div>
                        <div className="k-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <ProgressRing value={72} size={48} label="72" tone="ink" />
                                <div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Topics mastered</div>
                                    <div
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 500,
                                            letterSpacing: "-0.018em",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        34 <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>/ 47</span>
                                    </div>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 1,
                                    background: "var(--hairline)",
                                    border: "1px solid var(--hairline)",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                }}
                            >
                                <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
                                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Exams</div>
                                    <div
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 500,
                                            letterSpacing: "-0.018em",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        9
                                    </div>
                                </div>
                                <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
                                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Grades</div>
                                    <div
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 500,
                                            letterSpacing: "-0.018em",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        7
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 11.5,
                                        marginBottom: 6,
                                    }}
                                >
                                    <span style={{ color: "var(--ink-3)" }}>Overall average</span>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            color: "var(--ink)",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        A− · 88.6%
                                    </span>
                                </div>
                                <div className="k-bar">
                                    <div className="k-bar__fill k-bar__fill--brand" style={{ width: "88%" }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shortcuts — exact kit copy */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div className="k-card__title">Shortcuts</div>
                            <kbd className="k-kbd">⌘ J</kbd>
                        </div>
                        <div style={{ padding: "6px 6px" }}>
                            <button type="button" className="qa" onClick={() => router.push("/student/assignments")}>
                                <Icon name="file" className="lead" />
                                Assignments
                                <Icon name="chev" className="chev" />
                            </button>
                            <button type="button" className="qa" onClick={() => router.push("/student/grades")}>
                                <Icon name="trophy" className="lead" />
                                Grades
                                <Icon name="chev" className="chev" />
                            </button>
                            <button type="button" className="qa" onClick={() => router.push("/student/calendar")}>
                                <Icon name="cal" className="lead" />
                                Calendar
                                <Icon name="chev" className="chev" />
                            </button>
                            <button type="button" className="qa" onClick={() => router.push("/student/learning-path")}>
                                <Icon name="sparkles" className="lead" />
                                Learning path
                                <Icon name="chev" className="chev" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? null : null}
        </div>
    );
}
