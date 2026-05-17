"use client";

import * as React from "react";
import {
    listNotifications,
    getSchoolSettings,
    getActiveAcademicYear,
    teacherDashboard,
    studentDashboard,
    myChildren,
    listFeedback,
    type BackendNotification,
    type FeedbackTicket,
} from "@/lib/admin-api";

type Role = "admin" | "teacher" | "student" | "parent";

export type ShellData = {
    role: Role | null;
    schoolName: string;
    academicYearLabel: string;
    userMeta: string;
    notifications: BackendNotification[];
    unreadCount: number;
    unreadByType: Record<string, number>;
    feedbackOpenCount: number;
    refreshNotifications: () => Promise<void>;
    refreshAll: () => Promise<void>;
};

const ShellDataContext = React.createContext<ShellData | null>(null);

function parseJson<T = unknown>(s: string | null | undefined): T | null {
    if (!s) return null;
    try {
        return JSON.parse(s) as T;
    } catch {
        return null;
    }
}

function pickSchoolName(raw: unknown): string {
    if (!raw || typeof raw !== "object") return "TriLink Academy";
    const r = raw as Record<string, unknown>;
    if (typeof r.schoolName === "string" && r.schoolName) return r.schoolName;
    if (typeof r.name === "string" && r.name) return r.name;
    if (typeof r.settingsJson === "string") {
        const parsed = parseJson<Record<string, unknown>>(r.settingsJson);
        const n = parsed && typeof parsed.schoolName === "string" ? parsed.schoolName : null;
        if (n) return n;
    }
    return "TriLink Academy";
}

function summarizeByType(rows: BackendNotification[]): Record<string, number> {
    const acc: Record<string, number> = {};
    for (const n of rows) {
        if (n.readAt) continue;
        const key = (n.type || "other").toLowerCase();
        acc[key] = (acc[key] ?? 0) + 1;
    }
    return acc;
}

export function ShellDataProvider({
    role,
    children,
}: {
    role: Role;
    children: React.ReactNode;
}) {
    const [notifications, setNotifications] = React.useState<BackendNotification[]>([]);
    const [schoolName, setSchoolName] = React.useState<string>("TriLink Academy");
    const [academicYearLabel, setAcademicYearLabel] = React.useState<string>("");
    const [userMeta, setUserMeta] = React.useState<string>("");
    const [feedbackOpenCount, setFeedbackOpenCount] = React.useState<number>(0);

    const refreshNotifications = React.useCallback(async () => {
        try {
            const list = await listNotifications(false);
            setNotifications(Array.isArray(list) ? list : []);
        } catch {
            setNotifications([]);
        }
    }, []);

    const refreshAll = React.useCallback(async () => {
        const [settings, yr] = await Promise.allSettled([
            getSchoolSettings(),
            getActiveAcademicYear(),
        ]);
        if (settings.status === "fulfilled") setSchoolName(pickSchoolName(settings.value));
        if (yr.status === "fulfilled" && yr.value) {
            setAcademicYearLabel(yr.value.label ?? "");
        }

        await refreshNotifications();

        if (role === "admin") {
            setUserMeta("");
            try {
                const tickets = (await listFeedback()) as FeedbackTicket[];
                setFeedbackOpenCount(
                    tickets.filter((t) => (t.status ?? "").toLowerCase() === "open").length,
                );
            } catch {
                setFeedbackOpenCount(0);
            }
        } else if (role === "teacher") {
            try {
                const d = await teacherDashboard();
                const classCount = typeof d?.myClasses === "number" ? d.myClasses : 0;
                setUserMeta(`Teacher · ${classCount} ${classCount === 1 ? "class" : "classes"}`);
            } catch {
                setUserMeta("Teacher");
            }
        } else if (role === "student") {
            try {
                const d = await studentDashboard();
                const meta = d as { grade?: string; section?: string; gradeName?: string; sectionName?: string };
                const grade = meta.grade ?? meta.gradeName ?? "";
                const section = meta.section ?? meta.sectionName ?? "";
                const parts = [grade && `Grade ${grade}`, section && `Section ${section}`].filter(Boolean);
                setUserMeta(parts.join(" · ") || "Student");
            } catch {
                setUserMeta("Student");
            }
        } else if (role === "parent") {
            try {
                const children = await myChildren();
                const first = children?.[0]?.student;
                if (first) {
                    setUserMeta(`${first.firstName} ${first.lastName}`.trim());
                } else {
                    setUserMeta("Parent");
                }
            } catch {
                setUserMeta("Parent");
            }
        }
    }, [role, refreshNotifications]);

    React.useEffect(() => {
        void refreshAll();
        const id = window.setInterval(() => {
            void refreshNotifications();
        }, 60_000);
        return () => window.clearInterval(id);
    }, [refreshAll, refreshNotifications]);

    const value = React.useMemo<ShellData>(() => {
        const unreadCount = notifications.filter((n) => !n.readAt).length;
        const unreadByType = summarizeByType(notifications);
        return {
            role,
            schoolName,
            academicYearLabel,
            userMeta,
            notifications,
            unreadCount,
            unreadByType,
            feedbackOpenCount,
            refreshNotifications,
            refreshAll,
        };
    }, [
        role,
        schoolName,
        academicYearLabel,
        userMeta,
        notifications,
        feedbackOpenCount,
        refreshNotifications,
        refreshAll,
    ]);

    return <ShellDataContext.Provider value={value}>{children}</ShellDataContext.Provider>;
}

export function useShellData(): ShellData {
    const ctx = React.useContext(ShellDataContext);
    if (!ctx) {
        return {
            role: null,
            schoolName: "TriLink Academy",
            academicYearLabel: "",
            userMeta: "",
            notifications: [],
            unreadCount: 0,
            unreadByType: {},
            feedbackOpenCount: 0,
            refreshNotifications: async () => {},
            refreshAll: async () => {},
        };
    }
    return ctx;
}

/** Lookup helper used by the sidebar to map a nav item -> unread count. */
export function badgeForNavItem(
    role: Role,
    itemId: string,
    shell: ShellData,
): number | string | undefined {
    if (itemId === "notifications") {
        return shell.unreadCount > 0 ? shell.unreadCount : undefined;
    }
    if (itemId === "announcements") {
        const n = shell.unreadByType["announcement"] ?? shell.unreadByType["announcements"] ?? 0;
        return n > 0 ? n : undefined;
    }
    if (itemId === "chat") {
        const n =
            (shell.unreadByType["chat"] ?? 0) +
            (shell.unreadByType["chat_message"] ?? 0) +
            (shell.unreadByType["message"] ?? 0);
        return n > 0 ? n : undefined;
    }
    if (itemId === "exams") {
        const n =
            (shell.unreadByType["exam"] ?? 0) +
            (shell.unreadByType["exam_published"] ?? 0) +
            (shell.unreadByType["exam_graded"] ?? 0);
        return n > 0 ? n : undefined;
    }
    if (itemId === "assignments") {
        const n =
            (shell.unreadByType["assignment"] ?? 0) +
            (shell.unreadByType["assignment_published"] ?? 0) +
            (shell.unreadByType["assignment_graded"] ?? 0);
        return n > 0 ? n : undefined;
    }
    if (itemId === "feedback" && role === "admin") {
        return shell.feedbackOpenCount > 0 ? shell.feedbackOpenCount : undefined;
    }
    if (itemId === "monitor" && role === "teacher") {
        return undefined; // wired to live exams elsewhere
    }
    return undefined;
}
