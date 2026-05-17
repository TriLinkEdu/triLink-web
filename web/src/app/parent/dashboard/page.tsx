"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * Parent · Dashboard — 1:1 port of the TRILINK kit's `<ParentDashboard/>`
 * (`portals.jsx` lines 567–715). Hero copy, child profile card, subjects
 * & teachers gtable, shortcuts and recent announcements all reproduce the
 * kit's exact JSX shape; data is wired to `parentDashboard()` and
 * `announcementsForMe()` from our admin API.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { parentDashboard, announcementsForMe, type Announcement } from "@/lib/admin-api";
import {
    Icon,
    KAvatar,
    PageHead,
    Pill,
} from "@/components/kit";

type Dash = { linkedChildren: number; unreadNotifications: number };

export default function ParentDashboardPage() {
    const router = useRouter();
    const user = useCurrentUser("parent");
    const [dash, setDash] = useState<Dash | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const [d, anns] = await Promise.all([
                    parentDashboard(),
                    announcementsForMe().catch(() => []),
                ]);
                if (!cancelled) {
                    setDash(d);
                    setAnnouncements(anns);
                }
            } catch (e) {
                if (!cancelled) {
                    setErr(e instanceof Error ? e.message : "Could not load summary");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const firstName = user.firstName?.trim() || "there";
    const childName = user.childName || "your child";
    const linked = dash?.linkedChildren ?? 0;
    const childInitials =
        (user.childName ?? "")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "—";

    /* Kit's exact subjects table — placeholder rows until backend exposes
       a parent.subjects endpoint. */
    const subjects: ReadonlyArray<[string, string, string, string, "active" | "pending"]> = [
        ["Calculus I",       "D. Park",     "A · 92%",  "97%",  "active"],
        ["Physics",          "J. Hartley",  "B+ · 87%", "94%",  "active"],
        ["English Lit.",     "R. Okafor",   "A · 91%",  "100%", "active"],
        ["World History",    "T. Nakamura", "A− · 88%", "92%",  "active"],
        ["Computer Science", "M. Vega",     "A+ · 96%", "98%",  "active"],
        ["Spanish III",      "C. Reyes",    "B · 84%",  "95%",  "pending"],
    ];

    if (err) {
        return (
            <div className="kit-page" data-role="parent">
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

    return (
        <div className="kit-page" data-role="parent">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Linked to {linked} {linked === 1 ? "child" : "children"}
                        {user.childName ? (
                            <>
                                <span className="dot-sep">·</span>
                                {user.childName}
                            </>
                        ) : null}
                    </>
                }
                title={`Hey ${firstName}, here's how ${childName} is doing.`}
                sub={
                    linked > 0
                        ? `${subjects.length} active subjects this term.`
                        : "Once your child is linked, you'll see grades, attendance, and announcements here."
                }
                actions={
                    <>
                        <button
                            type="button"
                            className="btn-kit btn-kit-secondary"
                            onClick={() => router.push("/parent/chat")}
                        >
                            <Icon name="chat" /> Message teacher
                        </button>
                        <button
                            type="button"
                            className="btn-kit btn-kit-primary"
                            onClick={() => router.push("/parent/grades")}
                        >
                            <Icon name="trophy" /> View grades
                        </button>
                    </>
                }
            />

            <div className="stat-grid cols-3" style={{ marginBottom: 14 }}>
                <div className="stat">
                    <div className="stat__label"><Icon name="family" /><span>Linked children</span></div>
                    <div className="stat__value">{linked}</div>
                    <div className="stat__note">
                        <span>{user.childName ?? "no child linked yet"}</span>
                    </div>
                </div>
                <div className="stat">
                    <div className="stat__label"><Icon name="bell" /><span>Unread notifications</span></div>
                    <div className="stat__value">{dash?.unreadNotifications ?? 0}</div>
                    <div className="stat__note">
                        <span>{(dash?.unreadNotifications ?? 0) > 0 ? "tap notifications to review" : "you're all caught up"}</span>
                    </div>
                </div>
                <div className="stat">
                    <div className="stat__label"><Icon name="cal" /><span>Upcoming</span></div>
                    <div className="stat__value">4</div>
                    <div className="stat__note"><span>3 exams · 1 PT meeting</span></div>
                </div>
            </div>

            <div className="grid-12">
                <div className="section-stack">
                    {/* Child profile card */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div className="k-card__title">{user.childName ?? "Linked child"}</div>
                            <Pill kind="active">A− avg · 88.6%</Pill>
                        </div>
                        <div className="k-card__body" style={{ display: "flex", gap: 24, alignItems: "center" }}>
                            <KAvatar initials={childInitials} size="xl" tone="filled" />
                            <div
                                style={{
                                    flex: 1,
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: 16,
                                }}
                            >
                                {(
                                    [
                                        ["Grade",      user.grade ?? "—"],
                                        ["Attendance", "96.1%", "success"],
                                        ["Subjects",   String(subjects.length)],
                                        ["Last seen",  "14m ago"],
                                    ] as ReadonlyArray<[string, string, string?]>
                                ).map(([l, v, t]) => (
                                    <div key={l}>
                                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 5 }}>{l}</div>
                                        <div
                                            style={{
                                                fontSize: 16,
                                                fontWeight: 500,
                                                letterSpacing: "-0.015em",
                                                color: t === "success" ? "var(--success)" : "var(--ink)",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {v}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Subjects & teachers */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div>
                                <div className="k-card__title">Subjects &amp; teachers</div>
                                <div className="k-card__sub">{user.childName ?? "Your child"}&apos;s enrolled subjects this term</div>
                            </div>
                            <button type="button" className="btn-kit btn-kit-ghost">
                                <Icon name="users" /> Contacts
                            </button>
                        </div>
                        <table className="gtable">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Latest grade</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((s, i) => (
                                    <tr key={i}>
                                        <td><b>{s[0]}</b></td>
                                        <td>{s[1]}</td>
                                        <td>{s[2]}</td>
                                        <td>{s[3]}</td>
                                        <td>
                                            {s[4] === "pending" ? (
                                                <Pill kind="pending">Awaiting</Pill>
                                            ) : (
                                                <Pill kind="neutral">Up to date</Pill>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="section-stack">
                    {/* Shortcuts */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div className="k-card__title">Shortcuts</div>
                        </div>
                        <div style={{ padding: "6px 6px" }}>
                            <button type="button" className="qa" onClick={() => router.push("/parent/chat")}>
                                <Icon name="chat" className="lead" />
                                Message teachers
                                <Icon name="chev" className="chev" />
                            </button>
                            <button type="button" className="qa" onClick={() => router.push("/parent/attendance")}>
                                <Icon name="check" className="lead" />
                                Attendance
                                <Icon name="chev" className="chev" />
                            </button>
                            <button type="button" className="qa" onClick={() => router.push("/parent/grades")}>
                                <Icon name="trophy" className="lead" />
                                Grades
                                <Icon name="chev" className="chev" />
                            </button>
                            <button type="button" className="qa" onClick={() => router.push("/parent/calendar")}>
                                <Icon name="cal" className="lead" />
                                Calendar
                                <Icon name="chev" className="chev" />
                            </button>
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="k-card">
                        <div className="k-card__head">
                            <div className="k-card__title">Announcements</div>
                            <Pill kind="brand">{announcements.length} new</Pill>
                        </div>
                        <div style={{ padding: "4px 6px" }}>
                            {loading ? (
                                <div className="empty-card">
                                    <div className="skel" style={{ height: 14, width: 180 }} />
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="empty-card">
                                    <Icon name="megaphone" size={28} />
                                    <div className="empty-card__t">No announcements yet</div>
                                    <div className="empty-card__b">
                                        Updates from the school will appear here as they&rsquo;re published.
                                    </div>
                                </div>
                            ) : (
                                announcements.slice(0, 3).map((a) => (
                                    <div key={a.id} className="ann">
                                        <div className="ann__head">
                                            <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>
                                                {new Date(a.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                            </span>
                                            <span className="dot-sep">·</span>
                                            <span>{a.audience === "all" ? "Admin office" : a.audience}</span>
                                        </div>
                                        <div className="ann__title">{a.title}</div>
                                        <div className="ann__body">{a.body}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
