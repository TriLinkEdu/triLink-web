"use client";
import {
    BookOpen, ClipboardList, Users, Bell,
    Calendar, FileText, MessageSquare, Megaphone, BarChart2,
} from "lucide-react";
import { useCalendarStore } from "@/store/calendarStore";

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const TYPE_DOT: Record<string, string> = {
    class: "var(--primary-500)",
    exam: "var(--danger)",
    meeting: "var(--warning)",
    reminder: "var(--success)",
};
const TYPE_BG: Record<string, string> = {
    class: "var(--primary-50)",
    exam: "var(--danger-light)",
    meeting: "var(--warning-light)",
    reminder: "var(--success-light)",
};
const TYPE_COLOR: Record<string, string> = {
    class: "var(--primary-600)",
    exam: "#991b1b",
    meeting: "#92400e",
    reminder: "#065f46",
};
const TYPE_ICON: Record<string, LucideIcon> = {
    class: BookOpen, exam: ClipboardList, meeting: Users, reminder: Bell,
};

function EvTypeIcon({ type, size = 18 }: { type: string; size?: number }) {
    const Ic = TYPE_ICON[type];
    return <Ic size={size} color={TYPE_COLOR[type]} strokeWidth={2} />;
}

const STATIC_NOTIFS: { title: string; time: string; Icon: LucideIcon; bg: string; iconColor: string }[] = [
    { title: "Abebe submitted lab report",           time: "10m ago", Icon: FileText,      bg: "var(--primary-100)",   iconColor: "var(--primary-600)" },
    { title: "New feedback received from Sara",      time: "1h ago",  Icon: MessageSquare, bg: "var(--purple-light)",  iconColor: "#7c3aed" },
    { title: "Admin: Please submit grades by Friday",time: "3h ago",  Icon: Megaphone,     bg: "var(--warning-light)", iconColor: "#92400e" },
    { title: "Quiz results ready for Grade 11-A",    time: "5h ago",  Icon: BarChart2,     bg: "var(--success-light)", iconColor: "#065f46" },
];

export default function TeacherNotifications() {
    const { events } = useCalendarStore();

    const todayEvents    = events.filter(e => e.date === TODAY_ISO);
    const tomorrowISO    = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const tomorrowEvents = events.filter(e => e.date === tomorrowISO);
    const upcomingEvents = events
        .filter(e => e.date > TODAY_ISO && e.date !== tomorrowISO)
        .filter(e => new Date(e.date).getTime() - Date.now() <= 7 * 864e5)
        .sort((a, b) => a.date.localeCompare(b.date));

    const calendarNotifs = [
        ...todayEvents.map(e => ({ ...e, tag: "TODAY" as const, tagColor: "var(--primary-500)" })),
        ...tomorrowEvents.map(e => ({ ...e, tag: "TOMORROW" as const, tagColor: "var(--warning)" })),
        ...upcomingEvents.map(e => ({ ...e, tag: "UPCOMING" as const, tagColor: "var(--success)" })),
    ];

    const totalUnread = calendarNotifs.length + STATIC_NOTIFS.length;

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">{totalUnread} notification{totalUnread !== 1 ? "s" : ""}</p>
                </div>
                <a href="/teacher/calendar" className="btn btn-secondary" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} strokeWidth={2} /> View Calendar</a>
            </div>

            {/* Calendar event notifications */}
            {calendarNotifs.length > 0 && (
                <>
                    <h4 style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Calendar Reminders</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                        {calendarNotifs.map(ev => {
                            const evDate = new Date(ev.date + "T00:00:00");
                            return (
                                <div key={ev.id} className="card" style={{ padding: "1rem 1.25rem", borderLeft: `4px solid ${TYPE_DOT[ev.type]}` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-full)", background: TYPE_BG[ev.type], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <EvTypeIcon type={ev.type} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{ev.title}</div>
                                                <span style={{ fontSize: "0.65rem", background: ev.tagColor, color: "#fff", borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>{ev.tag}</span>
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2 }}>
                                                {MONTH_NAMES[evDate.getMonth()]} {evDate.getDate()}{ev.time ? ` at ${ev.time}` : ""}
                                                {ev.description && ` · ${ev.description}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Static system notifications */}
            <h4 style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>System Notifications</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {STATIC_NOTIFS.map((n, i) => (
                    <div key={i} className="card" style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-full)", background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <n.Icon size={18} color={n.iconColor} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{n.title}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{n.time}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
