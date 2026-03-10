"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    MessageSquare, Calendar, Megaphone, ClipboardList,
    BookOpen, Users, Bell, FileText, CheckCheck, Clock,
    ChevronRight, X,
} from "lucide-react";
import { useCalendarStore } from "@/store/calendarStore";
import { useAnnouncementStore } from "@/store/announcementStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";

// ─── constants ────────────────────────────────────────────────────────────────
const TEACHER_ID = "teacher-1";
const TODAY_ISO   = new Date().toISOString().slice(0, 10);
const WEEK_MS     = 7 * 24 * 60 * 60 * 1000;
const MN          = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── category meta ────────────────────────────────────────────────────────────
type Category = "message" | "calendar" | "announcement" | "exam";

const CAT_META: Record<Category, { label: string; accent: string; bg: string; iconColor: string }> = {
    message:      { label: "Message",      accent: "var(--primary-500)", bg: "var(--primary-100)",   iconColor: "var(--primary-600)" },
    calendar:     { label: "Calendar",     accent: "var(--warning)",     bg: "var(--warning-light)", iconColor: "#92400e" },
    announcement: { label: "Announcement", accent: "var(--purple)",      bg: "var(--purple-light)",  iconColor: "#7c3aed" },
    exam:         { label: "Exam",         accent: "var(--danger)",      bg: "var(--danger-light)",  iconColor: "#991b1b" },
};

const CAL_TYPE_COLOR: Record<string, string> = {
    class: "var(--primary-600)", exam: "#991b1b", meeting: "#92400e", reminder: "#065f46",
};
const CAL_TYPE_BG: Record<string, string> = {
    class: "var(--primary-100)", exam: "var(--danger-light)", meeting: "var(--warning-light)", reminder: "var(--success-light)",
};
const CAL_TYPE_ACCENT: Record<string, string> = {
    class: "var(--primary-500)", exam: "var(--danger)", meeting: "var(--warning)", reminder: "var(--success)",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function relTime(isoOrMs: string | number): string {
    try {
        const d   = typeof isoOrMs === "number" ? isoOrMs : new Date(isoOrMs).getTime();
        const ago = Date.now() - d;
        const min = Math.floor(ago / 60_000);
        if (min < 1)  return "Just now";
        if (min < 60) return `${min}m ago`;
        const h = Math.floor(min / 60);
        if (h < 24)   return `${h}h ago`;
        const dy = Math.floor(h / 24);
        if (dy < 7)   return `${dy}d ago`;
        const dt = new Date(d);
        return `${MN[dt.getMonth()]} ${dt.getDate()}`;
    } catch { return ""; }
}

function calDateLabel(dateIso: string): string {
    const today    = TODAY_ISO;
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    if (dateIso === today)    return "TODAY";
    if (dateIso === tomorrow) return "TOMORROW";
    return "UPCOMING";
}

function calLabelColor(tag: string): string {
    if (tag === "TODAY")    return "var(--primary-500)";
    if (tag === "TOMORROW") return "var(--warning)";
    return "var(--success)";
}

// ─── notification item type ────────────────────────────────────────────────────
interface Notif {
    id: string;
    category: Category;
    title: string;
    body: string;
    sortMs: number;
    timeLabel: string;
    href: string;
    /** extra badge for calendar events (TODAY / TOMORROW / UPCOMING) */
    badge?: string;
}

// ─── static exam submission seeds ─────────────────────────────────────────────
const EXAM_SEEDS: Notif[] = [
    {
        id: "exam-sub-1",
        category: "exam",
        title: "Abebe Kebede submitted Chapter 7 Quiz",
        body: "Grade 11-A · Awaiting your review and grading.",
        sortMs: Date.now() - 15 * 60_000,
        timeLabel: "15m ago",
        href: "/teacher/exams",
    },
    {
        id: "exam-sub-2",
        category: "exam",
        title: "Sara Haile submitted Integration Assessment",
        body: "Grade 11-A · Awaiting your review and grading.",
        sortMs: Date.now() - 45 * 60_000,
        timeLabel: "45m ago",
        href: "/teacher/exams",
    },
    {
        id: "exam-sub-3",
        category: "exam",
        title: "Dawit Tadesse submitted Chapter 7 Quiz",
        body: "Grade 11-A · Awaiting your review and grading.",
        sortMs: Date.now() - 62 * 60_000,
        timeLabel: "1h ago",
        href: "/teacher/exams",
    },
    {
        id: "exam-sub-4",
        category: "exam",
        title: "Midterm grading deadline reminder",
        body: "Admin: Grade 11-B midterm papers are due for grading by Friday.",
        sortMs: Date.now() - 2 * 60 * 60_000,
        timeLabel: "2h ago",
        href: "/teacher/exams",
    },
];

// ─── icon components ──────────────────────────────────────────────────────────
const CAL_TYPE_ICON: Record<string, React.ReactNode> = {
    class:    <BookOpen   size={18} strokeWidth={2} />,
    exam:     <ClipboardList size={18} strokeWidth={2} />,
    meeting:  <Users      size={18} strokeWidth={2} />,
    reminder: <Bell       size={18} strokeWidth={2} />,
};

// ─── filter tabs ──────────────────────────────────────────────────────────────
type FilterTab = "all" | Category;

const FILTER_TABS: { key: FilterTab; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { key: "all",          label: "All",           Icon: Bell },
    { key: "message",      label: "Messages",      Icon: MessageSquare },
    { key: "calendar",     label: "Calendar",      Icon: Calendar },
    { key: "announcement", label: "Announcements", Icon: Megaphone },
    { key: "exam",         label: "Exams",         Icon: ClipboardList },
];

// ─── main component ───────────────────────────────────────────────────────────
export default function TeacherNotifications() {
    const { events }        = useCalendarStore();
    const { announcements } = useAnnouncementStore();
    const { conversations } = useChatStore();
    const { readIds, markRead, markAllRead, setTotal } = useNotificationStore();

    const [activeTab, setActiveTab] = useState<FilterTab>("all");

    // ── build unified notification list ──
    const allNotifs: Notif[] = useMemo(() => {
        const items: Notif[] = [];

        // 1. MESSAGES — last non-teacher message per conversation
        for (const conv of conversations) {
            const incoming = [...conv.messages]
                .reverse()
                .find((m) => m.senderId !== TEACHER_ID);
            if (!incoming) continue;
            const roleLabel =
                conv.type === "group"
                    ? `in ${conv.title}`
                    : conv.participants.find((p) => p.id !== TEACHER_ID)?.role === "parent"
                    ? "(Parent)"
                    : "";
            items.push({
                id: `msg-${conv.id}`,
                category: "message",
                title: `${incoming.senderName} ${roleLabel}`.trim(),
                body: incoming.text.length > 80 ? incoming.text.slice(0, 80) + "…" : incoming.text,
                sortMs: new Date(incoming.ts).getTime(),
                timeLabel: relTime(incoming.ts),
                href: "/teacher/chat",
            });
        }

        // 2. CALENDAR — today + next 7 days
        const nowMs = Date.now();
        for (const ev of events) {
            const evMs = new Date(ev.date + "T00:00:00").getTime();
            if (evMs < new Date(TODAY_ISO).getTime()) continue;
            if (evMs - nowMs > WEEK_MS) continue;
            const tag = calDateLabel(ev.date);
            const evDt = new Date(ev.date + "T00:00:00");
            items.push({
                id: `cal-${ev.id}`,
                category: "calendar",
                title: ev.title,
                body: `${MN[evDt.getMonth()]} ${evDt.getDate()}${ev.time ? ` at ${ev.time}` : ""}${ev.description ? ` · ${ev.description}` : ""}`,
                sortMs: tag === "TODAY" ? nowMs + 1 : evMs,  // today items float to top
                timeLabel: tag === "TODAY" ? "Today" : `${MN[evDt.getMonth()]} ${evDt.getDate()}`,
                href: "/teacher/calendar",
                badge: tag,
            });
        }

        // 3. ANNOUNCEMENTS — all from store
        for (const ann of announcements) {
            items.push({
                id: `ann-${ann.id}`,
                category: "announcement",
                title: ann.title,
                body: ann.status === "scheduled"
                    ? `Scheduled for ${ann.scheduledDate ?? ann.date} · ${ann.target}`
                    : `Sent ${ann.date} · ${ann.target}`,
                sortMs: ann.status === "scheduled"
                    ? Date.now() - 30 * 60_000  // treat scheduled as 30m ago
                    : Date.now() - 2 * 60 * 60_000,
                timeLabel: ann.status === "scheduled" ? "Scheduled" : ann.date,
                href: "/teacher/announcements",
                badge: ann.status === "scheduled" ? "SCHEDULED" : undefined,
            });
        }

        // 4. EXAMS — static seeds
        items.push(...EXAM_SEEDS);

        // sort newest first
        return items.sort((a, b) => b.sortMs - a.sortMs);
    }, [events, announcements, conversations]);

    // keep total in sync so the sidebar badge is accurate
    useMemo(() => { setTotal(allNotifs.length); }, [allNotifs.length, setTotal]);

    const readSet = new Set(readIds);

    const filtered = activeTab === "all"
        ? allNotifs
        : allNotifs.filter((n) => n.category === activeTab);

    function unreadCount(tab: FilterTab): number {
        const list = tab === "all" ? allNotifs : allNotifs.filter((n) => n.category === tab);
        return list.filter((n) => !readSet.has(n.id)).length;
    }

    function handleMarkAll() {
        markAllRead(allNotifs.map((n) => n.id));
    }

    const totalUnread = unreadCount("all");

    return (
        <div className="page-wrapper">
            {/* ── header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">
                        {totalUnread > 0 ? `${totalUnread} unread notification${totalUnread !== 1 ? "s" : ""}` : "All caught up!"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {totalUnread > 0 && (
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}
                            onClick={handleMarkAll}
                        >
                            <CheckCheck size={14} strokeWidth={2} />
                            Mark all as read
                        </button>
                    )}
                    <Link
                        href="/teacher/calendar"
                        className="btn btn-outline"
                        style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Calendar size={14} strokeWidth={2} />
                        View Calendar
                    </Link>
                </div>
            </div>

            {/* ── filter tabs ── */}
            <div
                style={{
                    display: "flex",
                    gap: "0.25rem",
                    background: "#fff",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--gray-100)",
                    padding: "0.375rem",
                    marginBottom: "1.25rem",
                    boxShadow: "var(--shadow-card)",
                    overflowX: "auto",
                }}
            >
                {FILTER_TABS.map(({ key, label, Icon }) => {
                    const uc = unreadCount(key);
                    const active = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.5rem 0.875rem",
                                borderRadius: "var(--radius-md)",
                                fontSize: "0.8125rem",
                                fontWeight: active ? 600 : 500,
                                color: active ? "var(--primary-700)" : "var(--gray-500)",
                                background: active ? "var(--primary-50)" : "transparent",
                                border: "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all var(--transition-fast)",
                            }}
                        >
                            <Icon size={14} strokeWidth={2} />
                            {label}
                            {uc > 0 && (
                                <span
                                    style={{
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        background: active ? "var(--primary-600)" : "var(--danger)",
                                        color: "#fff",
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "0 4px",
                                    }}
                                >
                                    {uc}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── notification list ── */}
            {filtered.length === 0 ? (
                <div
                    className="card"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "3rem",
                        gap: "0.75rem",
                        color: "var(--gray-400)",
                    }}
                >
                    <Bell size={40} strokeWidth={1.5} />
                    <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-600)" }}>No notifications</p>
                    <p style={{ fontSize: "0.875rem" }}>You&apos;re all caught up in this category.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {filtered.map((notif) => {
                        const isRead = readSet.has(notif.id);
                        const meta   = notif.category === "calendar"
                            ? null  // handled separately with event-type colors
                            : CAT_META[notif.category];

                        // for calendar items, use the event type accent from ev.type stored in title lookup
                        // we stored badge = tag (TODAY/TOMORROW/UPCOMING), accent comes from CAL_TYPE_ACCENT
                        // but we can't easily recover ev.type here; use CAL_TYPE_ACCENT via the stored accent
                        const accent = notif.category === "calendar"
                            ? "var(--warning)"  // default calendar accent
                            : meta!.accent;
                        const bg = notif.category === "calendar"
                            ? "var(--warning-light)"
                            : meta!.bg;
                        const iconColor = notif.category === "calendar"
                            ? "#92400e"
                            : meta!.iconColor;

                        const IconComp =
                            notif.category === "message"      ? MessageSquare :
                            notif.category === "calendar"     ? Calendar :
                            notif.category === "announcement" ? Megaphone :
                            ClipboardList;

                        return (
                            <div
                                key={notif.id}
                                className="card"
                                onClick={() => markRead(notif.id)}
                                style={{
                                    padding: "1rem 1.25rem",
                                    borderLeft: `4px solid ${isRead ? "var(--gray-200)" : accent}`,
                                    cursor: "pointer",
                                    opacity: isRead ? 0.7 : 1,
                                    transition: "opacity var(--transition-fast), box-shadow var(--transition-fast)",
                                    position: "relative",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                                    {/* icon circle */}
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "var(--radius-full)",
                                            background: isRead ? "var(--gray-100)" : bg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            color: isRead ? "var(--gray-400)" : iconColor,
                                        }}
                                    >
                                        <IconComp size={18} strokeWidth={2} />
                                    </div>

                                    {/* content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: 2 }}>
                                            <span
                                                style={{
                                                    fontSize: "0.875rem",
                                                    fontWeight: isRead ? 500 : 600,
                                                    color: isRead ? "var(--gray-500)" : "var(--gray-800)",
                                                }}
                                            >
                                                {notif.title}
                                            </span>
                                            {notif.badge && (
                                                <span
                                                    style={{
                                                        fontSize: "0.6rem",
                                                        fontWeight: 700,
                                                        background: notif.badge === "TODAY"
                                                            ? "var(--primary-500)"
                                                            : notif.badge === "TOMORROW"
                                                            ? "var(--warning)"
                                                            : notif.badge === "SCHEDULED"
                                                            ? "var(--purple)"
                                                            : "var(--success)",
                                                        color: "#fff",
                                                        borderRadius: 20,
                                                        padding: "2px 7px",
                                                    }}
                                                >
                                                    {notif.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            style={{
                                                fontSize: "0.8125rem",
                                                color: "var(--gray-400)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {notif.body}
                                        </p>
                                    </div>

                                    {/* right side: time + unread dot + action */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-end",
                                            gap: "0.4rem",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.4rem",
                                                fontSize: "0.75rem",
                                                color: "var(--gray-400)",
                                            }}
                                        >
                                            <Clock size={12} strokeWidth={2} />
                                            {notif.timeLabel}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                            {!isRead && (
                                                <div
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: accent,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            <Link
                                                href={notif.href}
                                                onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    color: "var(--primary-500)",
                                                    padding: "2px 4px",
                                                    borderRadius: 4,
                                                }}
                                            >
                                                <ChevronRight size={14} strokeWidth={2} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
