import { create } from "zustand";

export interface Announcement {
    id: number;
    title: string;
    target: string;
    message: string;
    status: "sent" | "scheduled";
    date: string;
    scheduledDate?: string;
}

interface AnnouncementStore {
    announcements: Announcement[];
    addAnnouncement: (a: Omit<Announcement, "id">) => void;
}

export const useAnnouncementStore = create<AnnouncementStore>((set) => ({
    announcements: [
        { id: 1, title: "Math Quiz Tomorrow", target: "Grade 11-A", message: "Please prepare for the math quiz scheduled for tomorrow.", status: "sent", date: "Feb 18" },
        { id: 2, title: "Homework Deadline Extended", target: "All Classes", message: "The homework deadline has been extended by one week.", status: "sent", date: "Feb 16" },
        { id: 3, title: "Exam Preparation Tips", target: "Grade 12-A", message: "Check the shared document for exam preparation tips.", status: "scheduled", date: "Feb 14", scheduledDate: "Feb 20" },
    ],
    addAnnouncement: (a) =>
        set((state) => ({
            announcements: [{ ...a, id: Date.now() }, ...state.announcements],
        })),
}));
