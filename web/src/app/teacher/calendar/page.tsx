"use client";
import { useState, useRef, useEffect } from "react";
import {
    BookOpen, ClipboardList, Users, Bell,
    Clock, ChevronLeft, ChevronRight, X, Plus, Trash2,
} from "lucide-react";
import { useCalendarStore, EventType, CalendarEvent } from "@/store/calendarStore";

const TODAY = new Date();
const toLocalISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseLocalISODate = (iso: string) => {
    const [y, m, day] = iso.split("-").map(Number);
    return new Date(y, m - 1, day);
};
const todayISO = toLocalISODate(TODAY);

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const TYPE_CFG: Record<EventType, { label: string; color: string; bg: string; dot: string; Icon: LucideIcon }> = {
    class:    { label: "Class",    color: "var(--primary-600)", bg: "var(--primary-50)",    dot: "var(--primary-500)",  Icon: BookOpen },
    exam:     { label: "Exam",     color: "#991b1b",           bg: "var(--danger-light)",  dot: "var(--danger)",       Icon: ClipboardList },
    meeting:  { label: "Meeting",  color: "#92400e",           bg: "var(--warning-light)", dot: "var(--warning)",      Icon: Users },
    reminder: { label: "Reminder", color: "#065f46",           bg: "var(--success-light)", dot: "var(--success)",      Icon: Bell },
};

function EventIcon({ type, size = 16 }: { type: EventType; size?: number }) {
    const Ic = TYPE_CFG[type].Icon;
    return <Ic size={size} color={TYPE_CFG[type].color} strokeWidth={2} />;
}

const INPUT_STYLE: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.875rem",
    border: "1.5px solid var(--gray-200)", borderRadius: 8,
    fontSize: "0.875rem", fontFamily: "inherit", background: "var(--gray-50)",
    color: "var(--gray-800)",
};

interface Toast { id: string; title: string; body: string; type: EventType; }

const BLANK_FORM = (date: string) => ({ title: "", date, time: "", type: "class" as EventType, description: "" });

export default function TeacherCalendar() {
    const { events, addEvent, removeEvent } = useCalendarStore();

    const [viewYear,  setViewYear]  = useState(TODAY.getFullYear());
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [selDay,    setSelDay]    = useState<number | null>(TODAY.getDate());
    const [showModal, setShowModal] = useState(false);
    const [form,      setForm]      = useState(BLANK_FORM(todayISO));
    const [toasts,    setToasts]    = useState<Toast[]>([]);
    const [pastDatePopup, setPastDatePopup] = useState<string | null>(null);

    const initialEvents = useRef(events);

    // Show notifications on mount for today's and upcoming events
    useEffect(() => {
        const todayEvts  = initialEvents.current.filter(e => e.date === todayISO);
        const upcomingEvts = initialEvents.current.filter(e => {
            const diff = parseLocalISODate(e.date).getTime() - parseLocalISODate(todayISO).getTime();
            return diff > 0 && diff <= 7 * 864e5;
        });
        const newToasts: Toast[] = [
            ...todayEvts.map(e => ({
                id: `t-today-${e.id}`, type: e.type,
                title: `Today: ${e.title}`,
                body: e.time ? `Scheduled at ${e.time}` : "All day",
            })),
            ...(upcomingEvts.length > 0 ? [{
                id: "t-upcoming", type: "reminder" as EventType,
                title: `${upcomingEvts.length} upcoming event${upcomingEvts.length > 1 ? "s" : ""} this week`,
                body: upcomingEvts.slice(0, 2).map(e => e.title).join(", ") + (upcomingEvts.length > 2 ? "…" : ""),
            }] : []),
        ];
        if (newToasts.length) {
            setToasts(newToasts);
            setTimeout(() => setToasts([]), 6000);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calendar math
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const dayISO = (d: number) =>
        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const eventsOnDay = (d: number) => events.filter(e => e.date === dayISO(d));

    const upcomingEvents = [...events]
        .filter(e => e.date >= todayISO)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));

    const isPastDate = (date: string) => parseLocalISODate(date).getTime() < parseLocalISODate(todayISO).getTime();

    const selDayEvents: CalendarEvent[] = selDay !== null ? eventsOnDay(selDay) : [];
    const selectedDayISO = selDay !== null ? dayISO(selDay) : null;
    const selectedDayIsPast = selectedDayISO ? isPastDate(selectedDayISO) : false;

    function navMonth(dir: -1 | 1) {
        let m = viewMonth + dir, y = viewYear;
        if (m < 0)  { m = 11; y--; }
        if (m > 11) { m = 0;  y++; }
        setViewMonth(m); setViewYear(y); setSelDay(null);
    }

    function openModal(day?: number) {
        const d = day ?? TODAY.getDate();
        const date = day
            ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            : todayISO;
        if (isPastDate(date)) {
            setPastDatePopup("You cannot add an event to a past date.");
            return;
        }
        setForm(BLANK_FORM(date));
        setShowModal(true);
    }

    function handleAdd() {
        if (!form.title.trim() || !form.date) return;
        if (isPastDate(form.date)) {
            setPastDatePopup("You cannot add an event to a past date.");
            return;
        }
        const added = addEvent({ title: form.title.trim(), date: form.date, time: form.time || undefined, type: form.type, description: form.description || undefined });
        if (!added) {
            setPastDatePopup("You cannot add an event to a past date.");
            return;
        }
        const dateParts = form.date.split("-");
        const toast: Toast = {
            id: `t-added-${Date.now()}`, type: form.type,
            title: `Event added: ${form.title.trim()}`,
            body: `${MONTH_NAMES[parseInt(dateParts[1]) - 1]} ${parseInt(dateParts[2])}${form.time ? ` at ${form.time}` : ""}`,
        };
        setToasts(p => [...p, toast]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== toast.id)), 4000);
        setShowModal(false);
    }

    const isToday = (d: number) =>
        viewYear === TODAY.getFullYear() && viewMonth === TODAY.getMonth() && d === TODAY.getDate();

    return (
        <div className="page-wrapper">
            {/* Toasts */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className="toast" style={{ borderLeftColor: TYPE_CFG[t.type].dot }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: TYPE_CFG[t.type].bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <EventIcon type={t.type} size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 2 }}>{t.body}</div>
                        </div>
                        <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ color: "var(--gray-400)", padding: 4, flexShrink: 0, display: "flex" }}><X size={14} strokeWidth={2.5} /></button>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Calendar</h1>
                    <p className="page-subtitle">Manage your schedule — {events.length} event{events.length !== 1 ? "s" : ""} scheduled</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()} style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} strokeWidth={2.5} /> Add Event</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>
                {/* ── Calendar card ── */}
                <div className="card">
                    {/* Month navigation */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navMonth(-1)} style={{ display: "flex", alignItems: "center", gap: 4 }}><ChevronLeft size={15} strokeWidth={2.5} /> Prev</button>
                        <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>{MONTH_NAMES[viewMonth]} {viewYear}</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navMonth(1)} style={{ display: "flex", alignItems: "center", gap: 4 }}>Next <ChevronRight size={15} strokeWidth={2.5} /></button>
                    </div>

                    <div className="calendar-grid">
                        {DAY_NAMES.map(d => <div key={d} className="calendar-day-header">{d}</div>)}

                        {/* Blank padding */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`b${i}`} className="calendar-day" style={{ opacity: 0, pointerEvents: "none" }} />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvts = eventsOnDay(day);
                            const today   = isToday(day);
                            const sel     = selDay === day;
                            const past    = dayISO(day) < todayISO;
                            return (
                                <div
                                    key={day}
                                    className={`calendar-day${today ? " today" : ""}`}
                                    style={{
                                        opacity: past && !today ? 0.5 : 1,
                                        outline: sel && !today ? "2px solid var(--primary-400)" : "none",
                                        outlineOffset: 2,
                                        background: sel && !today ? "var(--primary-50)" : today ? "var(--primary-500)" : undefined,
                                        minHeight: 48, padding: "0.4rem 0.25rem",
                                        borderRadius: 8, cursor: "pointer",
                                        position: "relative",
                                    }}
                                    onClick={() => setSelDay(selDay === day ? null : day)}
                                    onDoubleClick={() => {
                                        if (!past) openModal(day);
                                    }}
                                    title={dayEvts.length > 0 ? `${dayEvts.length} event(s) · double-click to add` : "Double-click to add event"}
                                >
                                    <span style={{ fontSize: "0.875rem", fontWeight: today ? 700 : 500 }}>{day}</span>
                                    {dayEvts.length > 0 && (
                                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", marginTop: 3 }}>
                                            {dayEvts.slice(0, 4).map(e => (
                                                <span key={e.id} style={{ width: 5, height: 5, borderRadius: "50%", background: today ? "rgba(255,255,255,0.8)" : TYPE_CFG[e.type].dot, display: "inline-block" }} />
                                            ))}
                                            {dayEvts.length > 4 && <span style={{ fontSize: "0.55rem", color: today ? "rgba(255,255,255,0.7)" : "var(--gray-400)", lineHeight: 1 }}>+{dayEvts.length - 4}</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--gray-100)", flexWrap: "wrap", alignItems: "center" }}>
                        {(Object.entries(TYPE_CFG) as [EventType, typeof TYPE_CFG[EventType]][]).map(([type, cfg]) => (
                            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--gray-600)" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                                {cfg.label}
                            </div>
                        ))}
                        <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--gray-400)" }}>Click to select · Double-click to add</span>
                    </div>

                    {/* Selected day detail panel */}
                    {selDay !== null && (
                        <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--gray-50)", borderRadius: 10, border: "1px solid var(--gray-200)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <h4 style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                                    {MONTH_NAMES[viewMonth]} {selDay}, {viewYear}
                                    {isToday(selDay) && (
                                        <span style={{ fontSize: "0.68rem", background: "var(--primary-500)", color: "#fff", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>Today</span>
                                    )}
                                </h4>
                                {!selectedDayIsPast && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => openModal(selDay)}
                                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                                    ><Plus size={14} strokeWidth={2.5} /> Add</button>
                                )}
                                {selectedDayIsPast && (
                                    <span style={{ fontSize: "0.68rem", background: "var(--gray-200)", color: "var(--gray-600)", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>
                                        Past date (view only)
                                    </span>
                                )}
                            </div>
                            {selDayEvents.length === 0 ? (
                                <p style={{ fontSize: "0.8rem", color: "var(--gray-400)", textAlign: "center", padding: "0.5rem" }}>
                                    {selectedDayIsPast ? "No events were recorded for this past date." : "No events · double-click calendar day to add one"}
                                </p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {selDayEvents.map(ev => (
                                        <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.875rem", background: "#fff", borderRadius: 8, border: "1px solid var(--gray-200)", borderLeft: `3px solid ${TYPE_CFG[ev.type].dot}` }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 7, background: TYPE_CFG[ev.type].bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <EventIcon type={ev.type} size={15} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{ev.title}</div>
                                                {ev.time && <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} strokeWidth={2} />{ev.time}</div>}
                                                {ev.description && <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 2 }}>{ev.description}</div>}
                                            </div>
                                            <span style={{ fontSize: "0.68rem", background: TYPE_CFG[ev.type].bg, color: TYPE_CFG[ev.type].color, borderRadius: 20, padding: "2px 8px", fontWeight: 700, flexShrink: 0 }}>
                                                {TYPE_CFG[ev.type].label}
                                            </span>
                                            <button
                                                onClick={() => removeEvent(ev.id)}
                                                title="Remove event"
                                                style={{ background: "var(--danger-light)", color: "#991b1b", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
                                            ><Trash2 size={13} strokeWidth={2} /> Remove</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Upcoming events sidebar ── */}
                <div className="card" style={{ padding: "1.25rem" }}>
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>Upcoming Events</h3>
                    {upcomingEvents.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)", fontSize: "0.875rem" }}>No upcoming events</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {upcomingEvents.map(ev => {
                                const evDate   = new Date(ev.date + "T00:00:00");
                                const isEvToday = ev.date === todayISO;
                                const diffDays = Math.ceil((new Date(ev.date + "T00:00:00").getTime() - new Date(todayISO + "T00:00:00").getTime()) / 864e5);
                                return (
                                    <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.7rem", background: isEvToday ? "var(--primary-50)" : "var(--gray-50)", borderRadius: 8, borderLeft: `3px solid ${TYPE_CFG[ev.type].dot}` }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 6, background: TYPE_CFG[ev.type].bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <EventIcon type={ev.type} size={14} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                                            <div style={{ fontSize: "0.72rem", color: "var(--gray-500)", marginTop: 2 }}>
                                                {MONTH_NAMES[evDate.getMonth()].slice(0, 3)} {evDate.getDate()}{ev.time ? ` · ${ev.time}` : ""}
                                            </div>
                                            {isEvToday && <span style={{ fontSize: "0.62rem", background: "var(--primary-500)", color: "#fff", borderRadius: 20, padding: "1px 6px", fontWeight: 700, display: "inline-block", marginTop: 3 }}>TODAY</span>}
                                            {!isEvToday && diffDays === 1 && <span style={{ fontSize: "0.62rem", background: "var(--warning-light)", color: "#92400e", borderRadius: 20, padding: "1px 6px", fontWeight: 700, display: "inline-block", marginTop: 3 }}>TOMORROW</span>}
                                        </div>
                                        <button
                                            onClick={() => removeEvent(ev.id)}
                                            title="Remove event"
                                            style={{ color: "var(--gray-400)", padding: "4px 5px", borderRadius: 4, border: "1px solid var(--gray-200)", background: "#fff", cursor: "pointer", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center" }}
                                        ><X size={12} strokeWidth={2.5} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add Event Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Event</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {/* Title */}
                            <div>
                                <label style={{ display: "block", fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-700)", marginBottom: 5 }}>Title *</label>
                                <input
                                    style={INPUT_STYLE}
                                    placeholder="e.g. Grade 11-A Math Class"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            {/* Date + Time */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-700)", marginBottom: 5 }}>Date *</label>
                                    <input
                                        type="date"
                                        style={INPUT_STYLE}
                                        value={form.date}
                                        min={todayISO}
                                        onChange={e => {
                                            const nextDate = e.target.value;
                                            if (isPastDate(nextDate)) {
                                                setPastDatePopup("You cannot add an event to a past date.");
                                                setForm(p => ({ ...p, date: todayISO }));
                                                return;
                                            }
                                            setForm(p => ({ ...p, date: nextDate }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-700)", marginBottom: 5 }}>Time (optional)</label>
                                    <input
                                        type="time"
                                        style={INPUT_STYLE}
                                        value={form.time}
                                        onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                                    />
                                </div>
                            </div>
                            {/* Type */}
                            <div>
                                <label style={{ display: "block", fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-700)", marginBottom: 5 }}>Type</label>
                                <select
                                    style={INPUT_STYLE}
                                    value={form.type}
                                    onChange={e => setForm(p => ({ ...p, type: e.target.value as EventType }))}
                                >
                                    <option value="class">Class</option>
                                    <option value="exam">Exam</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="reminder">Reminder</option>
                                </select>
                            </div>
                            {/* Description */}
                            <div>
                                <label style={{ display: "block", fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-700)", marginBottom: 5 }}>Description (optional)</label>
                                <textarea
                                    style={{ ...INPUT_STYLE, resize: "vertical" }}
                                    placeholder="Additional details…"
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title.trim() || !form.date}>Add Event</button>
                        </div>
                    </div>
                </div>
            )}

            {pastDatePopup && (
                <div className="modal-overlay" onClick={() => setPastDatePopup(null)}>
                    <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Date Not Allowed</h3>
                            <button className="modal-close" onClick={() => setPastDatePopup(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>
                            {pastDatePopup}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setPastDatePopup(null)}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
