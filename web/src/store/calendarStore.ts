import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EventType = "class" | "exam" | "meeting" | "reminder";

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;        // "YYYY-MM-DD"
    time?: string;       // "HH:MM"
    type: EventType;
    description?: string;
}

interface CalendarStore {
    events: CalendarEvent[];
    addEvent: (e: Omit<CalendarEvent, "id">) => void;
    removeEvent: (id: string) => void;
}

const mkId = () => Math.random().toString(36).slice(2, 9);

const SEED: CalendarEvent[] = [
    { id: "ev-1", title: "Grade 11-A Math Class",      date: "2026-03-09", time: "08:00", type: "class",    description: "Chapter 6: Integration techniques" },
    { id: "ev-2", title: "Grade 11-B Math Class",      date: "2026-03-09", time: "10:00", type: "class" },
    { id: "ev-3", title: "Staff Meeting",               date: "2026-03-10", time: "14:00", type: "meeting",  description: "Monthly staff coordination" },
    { id: "ev-4", title: "Grade 12 Midterm Exam",       date: "2026-03-12", time: "09:00", type: "exam",     description: "Covers chapters 1–8" },
    { id: "ev-5", title: "Parent-Teacher Conference",   date: "2026-03-15", time: "15:00", type: "meeting" },
    { id: "ev-6", title: "Assignment Deadline",         date: "2026-03-18", time: "23:59", type: "reminder", description: "Grade 11-A integration homework" },
    { id: "ev-7", title: "Grade 11-A Quiz",             date: "2026-03-23", time: "08:00", type: "exam",     description: "Chapter 7 quick quiz" },
    { id: "ev-8", title: "Department Review",           date: "2026-03-28", time: "13:00", type: "meeting" },
];

export const useCalendarStore = create<CalendarStore>()(
    persist(
        (set) => ({
            events: SEED,
            addEvent: (e) =>
                set((s) => ({ events: [...s.events, { ...e, id: mkId() }] })),
            removeEvent: (id) =>
                set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
        }),
        { name: "trilink-calendar-v1" }
    )
);
