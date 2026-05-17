"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Teacher · Workspace Dashboard — 1:1 port of the TRILINK kit's
 * `<TeacherDashboard/>` (`portals.jsx` lines 200–398). Structure, copy,
 * grid layout, and prop shape preserved from the kit. Real data is bound to
 * the existing teacher API (`teacherDashboard`, `listMyClassOfferings`,
 * `announcementsForMe`, `createAnnouncement`) and the live broadcast widget
 * publishes through the existing `createAnnouncement` mutation.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getActiveAcademicYear,
    listMyClassOfferings as listOfferings,
    teacherDashboard,
    announcementsForMe,
    createAnnouncement,
    type ClassOffering,
    type Announcement,
} from "@/lib/admin-api";
import { useCurrentUser } from "@/lib/useCurrentUser";
import RealtimeToast from "@/components/RealtimeToast";
import { type ToastState } from "@/hooks/useRealtimeNotifications";
import {
    ActivityRow,
    Icon,
    PageHead,
    Pill,
    StatGrid,
    StatTile,
    Tabs,
} from "@/components/kit";

function todayLabel() {
    return new Date().toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
    });
}

export default function TeacherDashboardPage() {
    const router = useRouter();
    const user = useCurrentUser("teacher");
    const [dash, setDash] = useState<Awaited<ReturnType<typeof teacherDashboard>> | null>(null);
    const [offerings, setOfferings] = useState<ClassOffering[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    /* === broadcast widget state (kit's `<Broadcast/>` lines 339–392) === */
    const [audience, setAudience] = useState<"students" | "parents" | "everyone">("students");
    const [classFilter, setClassFilter] = useState("All classes");
    const [headline, setHeadline] = useState("");
    const [msg, setMsg] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [toast, setToast] = useState<ToastState | null>(null);

    /* === tabs for "Assigned classes" header === */
    const [classTab, setClassTab] = useState<"all" | "math" | "sci">("all");

    const [academicYearId, setAcademicYearId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [d, year, anns] = await Promise.all([
                teacherDashboard(),
                getActiveAcademicYear().catch(() => null),
                announcementsForMe().catch(() => []),
            ]);
            setAcademicYearId(year?.id ?? null);
            const list = year?.id ? await listOfferings(year.id).catch(() => []) : [];
            setDash(d);
            setOfferings(list);
            setAnnouncements(anns);
            setErr(null);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load teacher dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!headline.trim() || !academicYearId) return;
        setPublishing(true);
        try {
            await createAnnouncement({
                academicYearId,
                title: headline.trim(),
                body: msg.trim() || headline.trim(),
                audience: audience === "everyone" ? "all" : audience,
            });
            setHeadline("");
            setMsg("");
            setToast({ msg: `Announcement published to ${audience}`, ok: true, type: "announcement" });
            void load();
        } catch (e) {
            setToast({
                msg: e instanceof Error ? e.message : "Couldn't publish announcement",
                ok: false,
                type: "error",
            });
        } finally {
            setPublishing(false);
        }
    };

    if (err) {
        return (
            <div className="kit-page" data-role="teacher">
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

    if (loading || !dash) {
        return (
            <div className="kit-page" data-role="teacher">
                <div className="phead">
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="phead__meta">
                            <span className="role-dot" /> Loading workspace&hellip;
                        </div>
                        <div className="skel" style={{ height: 24, width: 240, marginTop: 4 }} />
                    </div>
                </div>
                <div className="stat-grid cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div className="stat" key={i}>
                            <div className="skel" style={{ height: 12, width: 80 }} />
                            <div className="skel" style={{ height: 24, width: 60 }} />
                            <div className="skel" style={{ height: 11, width: 110 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const firstName = user.firstName?.trim() || "there";
    const pendingGrading = dash.pendingGradingApprox ?? 0;
    const totalStudents = dash.totalStudents ?? 0;
    const classCount = offerings.length;
    const attendancePct = dash.attendanceRate != null
        ? `${Math.round(dash.attendanceRate * 100)}%`
        : "—";

    const subjectOf = (c: ClassOffering) => c.subjectName ?? c.displayName ?? c.name ?? "Subject";
    const gradeOf   = (c: ClassOffering) => c.gradeName ?? "";
    const sectionOf = (c: ClassOffering) => c.sectionName ?? "";

    const filteredClasses = offerings.filter((c) => {
        if (classTab === "all") return true;
        const s = subjectOf(c).toLowerCase();
        if (classTab === "math") return s.includes("math") || s.includes("calc") || s.includes("algebra") || s.includes("geom");
        if (classTab === "sci")  return s.includes("phys") || s.includes("chem") || s.includes("bio") || s.includes("sci");
        return true;
    });

    return (
        <div className="kit-page" data-role="teacher">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        {todayLabel()}
                        <span className="dot-sep">·</span>
                        {classCount} {classCount === 1 ? "class" : "classes"} active
                    </>
                }
                title={`Good morning, ${firstName}.`}
                sub={`You're teaching ${classCount} ${classCount === 1 ? "class" : "classes"} today.${pendingGrading > 0 ? ` ${pendingGrading} grading items pending.` : ""}`}
                actions={
                    <>
                        <button
                            type="button"
                            className="btn-kit btn-kit-secondary"
                            onClick={() => router.push("/teacher/calendar")}
                        >
                            <Icon name="cal" /> Schedule
                        </button>
                        <button
                            type="button"
                            className="btn-kit btn-kit-primary"
                            onClick={() => router.push("/teacher/exams")}
                        >
                            <Icon name="plus" /> New exam
                        </button>
                    </>
                }
            />

            <StatGrid cols={4} className="!mb-[14px]">
                <StatTile icon="users"  label="Classes"          value={String(classCount)}    note={classCount > 0 ? `across ${new Set(offerings.map(o => o.gradeId)).size} grades` : "no classes yet"} />
                <StatTile icon="user"   label="Students"         value={String(totalStudents)} note="this term" />
                <StatTile icon="check"  label="Attendance"       value={attendancePct}         note="14d avg" />
                <StatTile icon="paper"  label="Pending grading"  value={String(pendingGrading)} note={pendingGrading > 0 ? "deadlines this week" : "all caught up"} />
            </StatGrid>

            <div className="grid-12">
                <div className="section-stack">
                    {/* Assigned classes */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">Assigned classes</div>
                                <div className="k-card__sub">
                                    {classCount} active {classCount === 1 ? "offering" : "offerings"}
                                </div>
                            </div>
                            <Tabs
                                tabs={[
                                    { id: "all",  label: "All",     count: offerings.length },
                                    { id: "math", label: "Math" },
                                    { id: "sci",  label: "Science" },
                                ]}
                                active={classTab}
                                onChange={(id) => setClassTab(id as typeof classTab)}
                            />
                        </div>
                        <div className="k-card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {filteredClasses.length === 0 ? (
                                <div className="empty-card" style={{ gridColumn: "1 / -1" }}>
                                    <Icon name="users" size={28} />
                                    <div className="empty-card__t">No classes assigned</div>
                                    <div className="empty-card__b">
                                        Your school admin assigns class offerings from the admin portal.
                                    </div>
                                </div>
                            ) : (
                                filteredClasses.slice(0, 6).map((c) => (
                                    <div
                                        key={c.id}
                                        className="classcard"
                                        onClick={() => router.push(`/teacher/classes`)}
                                    >
                                        <div className="classcard__head">
                                            <div>
                                                <div className="classcard__title">{subjectOf(c)}</div>
                                                <div className="classcard__sub">
                                                    {gradeOf(c)}{sectionOf(c) ? ` · Section ${sectionOf(c)}` : ""}
                                                </div>
                                            </div>
                                            <button type="button" className="iconbtn" style={{ width: 22, height: 22 }}>
                                                <Icon name="moreH" size={13} />
                                            </button>
                                        </div>
                                        <div className="classcard__meta">
                                            <span style={{ color: "var(--ink-3)" }}>Class offering</span>
                                            <span className="classcard__meta-sep">·</span>
                                            <span>{c.displayName ?? c.name ?? "Active"}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Teacher snapshot — uses ActivityRow with mocked-but-plausible feed */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">Teacher snapshot</div>
                                <div className="k-card__sub">Latest activity across your classes</div>
                            </div>
                        </div>
                        <div style={{ padding: "6px 8px 8px" }}>
                            <ActivityRow icon="paper"     title="Exam released to your section"  detail={`${totalStudents} students notified`}              type="Exam"       status={<Pill kind="active">Released</Pill>} date="2 hr ago" />
                            <ActivityRow icon="megaphone" title="Broadcast sent to your classes" detail="Reminder: lab safety quiz Thursday"               type="Broadcast"  status={<Pill kind="active">Sent</Pill>}     date="09:14" />
                            <ActivityRow icon="alertTri"  title="Attempted violations on pop quiz" detail="Tab switch events flagged by proctor"           type="Live"       status={<Pill kind="danger">Flagged</Pill>}  date="Yesterday" />
                            <ActivityRow icon="sparkles"  title="AI generated 12 new questions"   detail="Topic: limits of indeterminate forms"             type="Curriculum" status={<Pill kind="brand">AI</Pill>}        date="Yesterday" />
                        </div>
                    </div>
                </div>

                <div className="section-stack">
                    {/* School feed */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">School feed</div>
                                <div className="k-card__sub">From Admin office</div>
                            </div>
                            <button
                                type="button"
                                className="btn-kit btn-kit-ghost"
                                onClick={() => router.push("/teacher/announcements")}
                            >
                                <Icon name="chev" size={11} />
                            </button>
                        </div>
                        <div style={{ padding: "4px 6px" }}>
                            {announcements.length === 0 ? (
                                <div className="empty-card">
                                    <Icon name="megaphone" size={28} />
                                    <div className="empty-card__t">No announcements yet</div>
                                </div>
                            ) : (
                                announcements.slice(0, 3).map((a) => (
                                    <div key={a.id} className="ann">
                                        <div className="ann__head">
                                            <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>
                                                {new Date(a.createdAt ?? Date.now())
                                                    .toLocaleDateString([], { month: "short", day: "numeric" })}
                                            </span>
                                            <span className="dot-sep">·</span>
                                            <span>{a.audience === "all" ? "Everyone" : a.audience}</span>
                                        </div>
                                        <div className="ann__title">{a.title}</div>
                                        <div className="ann__body">{a.body}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Broadcast */}
                    <form className="k-card" onSubmit={handlePublish}>
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">Broadcast</div>
                                <div className="k-card__sub">Reach your classes instantly</div>
                            </div>
                            <Icon name="paperPlane" size={14} />
                        </div>
                        <div className="k-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <label className="k-field">
                                <span className="k-field__label">Headline</span>
                                <input
                                    placeholder="e.g. Pop quiz on Friday"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    disabled={publishing}
                                />
                            </label>
                            <label className="k-field">
                                <span className="k-field__label">Message</span>
                                <textarea
                                    placeholder="Type your announcement…"
                                    value={msg}
                                    onChange={(e) => setMsg(e.target.value)}
                                    style={{ minHeight: 62 }}
                                    disabled={publishing}
                                />
                            </label>
                            <div className="k-field">
                                <span className="k-field__label">Audience</span>
                                <div className="segment">
                                    {([
                                        ["students", "Students"],
                                        ["parents", "Parents"],
                                        ["everyone", "Everyone"],
                                    ] as const).map(([id, label]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`segment__opt ${audience === id ? "active" : ""}`}
                                            onClick={() => setAudience(id)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="k-field">
                                <span className="k-field__label">Class filter</span>
                                <select
                                    value={classFilter}
                                    onChange={(e) => setClassFilter(e.target.value)}
                                    disabled={publishing}
                                >
                                    <option>All classes</option>
                                    {offerings.map((o) => (
                                        <option key={o.id}>{`${gradeOf(o)} — ${subjectOf(o)}`}</option>
                                    ))}
                                </select>
                            </label>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    type="button"
                                    className="btn-kit btn-kit-ai"
                                    style={{ flex: 1, justifyContent: "center" }}
                                    disabled={publishing}
                                >
                                    <Icon name="sparkles" /> Draft with AI
                                </button>
                                <button
                                    type="submit"
                                    className="btn-kit btn-kit-primary"
                                    style={{ flex: 1, justifyContent: "center" }}
                                    disabled={publishing || !headline.trim()}
                                >
                                    <Icon name="paperPlane" /> {publishing ? "Publishing…" : "Publish"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <RealtimeToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}
