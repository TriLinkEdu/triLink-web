import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Announcement {
    id: number;
    title: string;
    target: string;
    message: string;
    status: "sent" | "scheduled";
    date: string;
    scheduledDate?: string;
    audience?: "everyone" | "students" | "teachers" | "parents";
    grade?: string;
    authorRole?: "admin" | "teacher";
}

interface AnnouncementStore {
    announcements: Announcement[];
    addAnnouncement: (a: Omit<Announcement, "id">) => void;
}

function inferAudience(target: string): "everyone" | "students" | "teachers" | "parents" {
    const t = target.toLowerCase();
    if (t.includes("teacher")) return "teachers";
    if (t.includes("parent")) return "parents";
    if (t.includes("student") || t.includes("grade") || t.includes("class")) return "students";
    return "everyone";
}

export function isAnnouncementVisibleToRole(
    ann: Announcement,
    role: "admin" | "teacher" | "student" | "parent",
    options?: { className?: string }
) {
    const audience = ann.audience ?? inferAudience(ann.target);

    if (role === "admin") return true;
    if (ann.authorRole === role) return true;
    if (audience === "everyone") return true;
    if (role === "teacher") return audience === "teachers";
    if (role === "parent") return audience === "parents";
    if (role === "student") {
        if (audience !== "students") return false;
        if (ann.grade && options?.className) return ann.grade === options.className;
        return true;
    }
    return false;
}

export const useAnnouncementStore = create<AnnouncementStore>()(
    persist(
        (set) => ({
            announcements: [
                { id: 1, title: "Math Quiz Tomorrow", target: "Grade 11-A", message: "Please prepare for the math quiz scheduled for tomorrow.", status: "sent", date: "Feb 18", audience: "students", grade: "Grade 11-A", authorRole: "teacher" },
                { id: 2, title: "Homework Deadline Extended", target: "All Classes", message: "The homework deadline has been extended by one week.", status: "sent", date: "Feb 16", audience: "students", authorRole: "teacher" },
                { id: 3, title: "Exam Preparation Tips", target: "Grade 12-A", message: "Check the shared document for exam preparation tips.", status: "scheduled", date: "Feb 14", scheduledDate: "Feb 20", audience: "students", grade: "Grade 12-A", authorRole: "teacher" },
            ],
            addAnnouncement: (a) =>
                set((state) => ({
                    announcements: [{ ...a, id: Date.now(), audience: a.audience ?? inferAudience(a.target) }, ...state.announcements],
                })),
        }),
        {
            name: "announcement-store",
        }
    )
);
