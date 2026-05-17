"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * KitHeader — 1:1 port of the TRILINK kit's `<Header/>` (`shell.jsx`
 * lines 242-268) + `PAGE_TITLES` lookup from `app.jsx` so each page's
 * crumb + h1 match the kit verbatim.
 *
 * Anatomy:
 *  - left: crumb (section name) · ChevronRight separator · page h1
 *  - right: `.header__cmdk` ⌘K trigger · bell with red dot · theme toggle
 *
 * The kit also accepts an `action` slot for page-specific CTAs (e.g. the
 * teacher's "End exam" button on Live Monitor); we expose that as a prop.
 */
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/kit";
import { KitThemeToggle } from "@/components/kit/theme-toggle";
import { NotificationsButton } from "@/components/kit/notifications-popover";
import { CmdkPalette } from "@/components/kit/cmdk-palette";

type Role = "student" | "teacher" | "admin" | "parent";

/**
 * Kit's `PAGE_TITLES` table — `[title, crumb]` for every screen. Mirrors
 * `app.jsx` lines 15-77 verbatim. Augmented with the few real routes we
 * have that aren't in the kit (e.g. `/admin/students`, `/admin/teachers`)
 * so every page still gets a kit-style header.
 */
const PAGE_TITLES: Record<Role, Record<string, readonly [string, string]>> = {
    student: {
        dashboard:     ["Dashboard",       "Home"],
        courses:       ["My Courses",      "Academics"],
        exams:         ["Exams",           "Academics"],
        assignments:   ["Assignments",     "Academics"],
        grades:        ["Grades",          "Academics"],
        "learning-path": ["Learning Path", "Academics · AI"],
        textbooks:     ["Textbooks",       "Academics"],
        curriculum:    ["Curriculum",      "Academics"],
        achievements:  ["Achievements",    "Academics"],
        goals:         ["Goals",           "Academics"],
        materials:     ["Materials",       "Academics"],
        calendar:      ["Calendar",        "Overview"],
        announcements: ["Announcements",   "Communication"],
        chat:          ["Chat",            "Communication"],
        notifications: ["Notifications",   "Communication"],
        feedback:      ["Feedback",        "Communication"],
        profile:       ["Profile",         "Settings"],
        settings:      ["Settings",        "Settings"],
        exam:          ["Exam",            "Academics"],
        result:        ["Result",          "Academics"],
    },
    teacher: {
        dashboard:     ["Teaching Workspace", "Home"],
        classes:       ["My Classes",         "Teaching"],
        students:      ["Students",           "Teaching"],
        attendance:    ["Attendance",         "Teaching"],
        assignments:   ["Assignments",        "Teaching"],
        materials:     ["Materials",          "Teaching"],
        exams:         ["Exam Builder",       "Assessment"],
        "exam-monitor": ["Live Exam Monitor", "Assessment · Live"],
        grades:        ["Grade Sheets",       "Assessment"],
        calendar:      ["Calendar",           "Overview"],
        announcements: ["Announcements",      "Communication"],
        chat:          ["Chat",               "Communication"],
        notifications: ["Notifications",      "Communication"],
        feedback:      ["Feedback",           "Communication"],
        profile:       ["Profile",            "Settings"],
        settings:      ["Settings",           "Settings"],
    },
    admin: {
        dashboard:     ["Command Center",     "Overview"],
        audit:         ["Audit log",          "Overview"],
        "school-setup": ["School Setup",      "Institution"],
        classes:       ["Academic Structure", "Institution"],
        curriculum:    ["Curriculum",         "Institution · AI"],
        textbooks:     ["Textbooks",          "Institution"],
        registration:  ["Registration",       "People"],
        students:      ["Students",           "People"],
        teachers:      ["Teachers",           "People"],
        parents:       ["Parents",            "People"],
        attendance:    ["Attendance",         "People"],
        announcements: ["Announcements",      "Communication"],
        feedback:      ["Feedback",           "Communication"],
        chat:          ["Chat",               "Communication"],
        profile:       ["Profile",            "Settings"],
        settings:      ["Settings",           "Settings"],
    },
    parent: {
        dashboard:     ["Dashboard",       "Home"],
        children:      ["Children",        "My Child"],
        grades:        ["Grades",          "My Child"],
        attendance:    ["Attendance",      "My Child"],
        subjects:      ["Subjects",        "My Child"],
        teachers:      ["Teachers",        "My Child"],
        calendar:      ["Calendar",        "Overview"],
        announcements: ["Announcements",   "Communication"],
        chat:          ["Chat",            "Communication"],
        feedback:      ["Feedback",        "Communication"],
        notifications: ["Notifications",   "Communication"],
        profile:       ["Profile",         "Settings"],
        settings:      ["Settings",        "Settings"],
    },
};

export interface KitHeaderProps {
    role: Role;
    /** Optional action slot, e.g. "End exam" CTA on the Live Monitor page. */
    action?: ReactNode;
    /** Force-override the crumb (for routes not in PAGE_TITLES). */
    crumb?: string;
    /** Force-override the title. */
    title?: string;
}

export function KitHeader({ role, action, crumb, title }: KitHeaderProps) {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);
    const page = segments[1] ?? "dashboard";
    const fallback = PAGE_TITLES[role][page] ?? [
        page[0]!.toUpperCase() + page.slice(1).replace(/-/g, " "),
        role[0]!.toUpperCase() + role.slice(1),
    ];
    const resolvedTitle = title ?? fallback[0];
    const resolvedCrumb = crumb ?? fallback[1];

    const [paletteOpen, setPaletteOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && (e.key === "k" || e.key === "K")) {
                e.preventDefault();
                setPaletteOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <header className="kit-shell-header" role="banner">
            <div className="header__title">
                {resolvedCrumb ? (
                    <>
                        <span className="header__crumb">{resolvedCrumb}</span>
                        <Icon name="chev" size={11} className="header__crumb-sep" />
                    </>
                ) : null}
                <span className="header__h1">{resolvedTitle}</span>
            </div>
            <div className="header__actions">
                <button
                    type="button"
                    className="header__cmdk"
                    aria-label="Open command palette"
                    onClick={() => setPaletteOpen(true)}
                >
                    <Icon name="search" size={13} />
                    <span>Search</span>
                    <kbd>⌘K</kbd>
                </button>
                <NotificationsButton role={role} />
                <KitThemeToggle />
                {action}
            </div>
            <CmdkPalette role={role} open={paletteOpen} onOpenChange={setPaletteOpen} />
        </header>
    );
}
