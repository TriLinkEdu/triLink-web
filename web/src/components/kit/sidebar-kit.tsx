"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * KitSidebar — 1:1 port of the TRILINK kit's `<Sidebar/>` (`shell.jsx`
 * lines 184-237) using the kit's exact NAV_CONFIG structure (`shell.jsx`
 * lines 83-182). The only adaptation is routing via Next.js `usePathname`
 * instead of the kit's in-memory `active` prop.
 *
 * The sidebar exposes:
 *  - role-tinted 26 px logo square + "TriLink" + "Northwood · {Role}"
 *  - sections with 10.5 px UPPERCASE labels
 *  - nav items with Lucide icons + optional `.badge-num` / `.badge-num.hot`
 *  - footer with 22 px avatar + name + role meta + workspace chevron
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type KitIconName } from "@/components/kit";
import { clearAuth, getStoredUser } from "@/lib/auth";
import { badgeForNavItem, useShellData } from "@/components/kit/ShellDataContext";

type Role = "student" | "teacher" | "admin" | "parent";

type NavItem = {
    id: string;
    label: string;
    icon: KitIconName;
    href: string;
    badge?: number | string;
    hot?: boolean;
};

type NavSection = { title: string; items: NavItem[] };

type NavConfig = {
    label: string;
    sections: NavSection[];
};

/**
 * Mirrors the kit's `NAV_CONFIG` but with Next.js hrefs slotted in for
 * every item id. Where the kit ships a screen we don't have yet, the href
 * points at the corresponding `app/{role}/{id}` directory (Next will
 * 404-handle missing routes — but every route in this config exists).
 */
const NAV_CONFIG: Record<Role, NavConfig> = {
    student: {
        label: "Student",
        sections: [
            { title: "Overview", items: [
                { id: "dashboard",     label: "Home",          icon: "home",     href: "/student/dashboard" },
                { id: "calendar",      label: "Calendar",      icon: "cal",      href: "/student/calendar" },
            ]},
            { title: "Academics", items: [
                { id: "courses",       label: "Courses",       icon: "book",     href: "/student/courses" },
                { id: "exams",         label: "Exams",         icon: "paper",    href: "/student/exams" },
                { id: "assignments",   label: "Assignments",   icon: "file",     href: "/student/assignments" },
                { id: "grades",        label: "Grades",        icon: "trophy",   href: "/student/grades" },
                { id: "lpath",         label: "Learning path", icon: "sparkles", href: "/student/learning-path" },
                { id: "textbooks",     label: "Textbooks",     icon: "library",  href: "/student/textbooks" },
            ]},
            { title: "Communication", items: [
                { id: "announcements", label: "Announcements", icon: "megaphone", href: "/student/announcements" },
                { id: "chat",          label: "Chat",          icon: "chat",      href: "/student/chat" },
                { id: "notifications", label: "Notifications", icon: "bell",      href: "/student/notifications", hot: true },
            ]},
        ],
    },
    teacher: {
        label: "Teacher",
        sections: [
            { title: "Overview", items: [
                { id: "dashboard",     label: "Home",          icon: "home",     href: "/teacher/dashboard" },
                { id: "calendar",      label: "Calendar",      icon: "cal",      href: "/teacher/calendar" },
            ]},
            { title: "Teaching", items: [
                { id: "classes",       label: "Classes",       icon: "users",    href: "/teacher/classes" },
                { id: "students",      label: "Students",      icon: "user",     href: "/teacher/students" },
                { id: "attendance",    label: "Attendance",    icon: "check",    href: "/teacher/attendance" },
                { id: "assignments",   label: "Assignments",   icon: "file",     href: "/teacher/assignments" },
            ]},
            { title: "Assessment", items: [
                { id: "exams",         label: "Exam builder",  icon: "paper",    href: "/teacher/exams" },
                { id: "monitor",       label: "Live monitor",  icon: "eye",      href: "/teacher/exam-monitor", hot: true },
                { id: "grades",        label: "Grades",        icon: "trophy",   href: "/teacher/grades" },
            ]},
            { title: "Communication", items: [
                { id: "announcements", label: "Announcements", icon: "megaphone", href: "/teacher/announcements" },
                { id: "chat",          label: "Chat",           icon: "chat",     href: "/teacher/chat" },
                { id: "notifications", label: "Notifications",  icon: "bell",     href: "/teacher/notifications" },
            ]},
        ],
    },
    admin: {
        label: "Admin",
        sections: [
            { title: "Overview", items: [
                { id: "dashboard",     label: "Command center", icon: "home",    href: "/admin/dashboard" },
                { id: "audit",         label: "Audit log",      icon: "history", href: "/admin/audit" },
            ]},
            { title: "Institution", items: [
                { id: "setup",         label: "School setup",      icon: "cog",      href: "/admin/school-setup" },
                { id: "classes",       label: "Academic structure", icon: "layers",  href: "/admin/classes" },
                { id: "curriculum",    label: "Curriculum",         icon: "sparkles", href: "/admin/curriculum" },
                { id: "textbooks",     label: "Textbooks",          icon: "library",  href: "/admin/textbooks" },
            ]},
            { title: "People", items: [
                { id: "registration",  label: "Registration", icon: "users", href: "/admin/registration" },
                { id: "students",      label: "Students",     icon: "user",  href: "/admin/students" },
                { id: "teachers",      label: "Teachers",     icon: "user",  href: "/admin/teachers" },
                { id: "parents",       label: "Parents",      icon: "family", href: "/admin/parents" },
                { id: "attendance",    label: "Attendance",   icon: "check", href: "/admin/attendance" },
            ]},
            { title: "Communication", items: [
                { id: "announcements", label: "Announcements", icon: "megaphone", href: "/admin/announcements" },
                { id: "feedback",      label: "Feedback",      icon: "inbox",     href: "/admin/feedback" },
                { id: "chat",          label: "Chat",          icon: "chat",      href: "/admin/chat" },
            ]},
        ],
    },
    parent: {
        label: "Parent",
        sections: [
            { title: "Overview", items: [
                { id: "dashboard",     label: "Home",         icon: "home", href: "/parent/dashboard" },
                { id: "calendar",      label: "Calendar",     icon: "cal",  href: "/parent/calendar" },
            ]},
            { title: "My child", items: [
                { id: "children",      label: "Children",     icon: "family", href: "/parent/children" },
                { id: "grades",        label: "Grades",       icon: "trophy", href: "/parent/grades" },
                { id: "attendance",    label: "Attendance",   icon: "check",  href: "/parent/attendance" },
                { id: "subjects",      label: "Subjects",     icon: "book",   href: "/parent/subjects" },
                { id: "teachers",      label: "Teachers",     icon: "users",  href: "/parent/teachers" },
            ]},
            { title: "Communication", items: [
                { id: "announcements", label: "Announcements", icon: "megaphone", href: "/parent/announcements" },
                { id: "chat",          label: "Chat",          icon: "chat",      href: "/parent/chat" },
                { id: "feedback",      label: "Feedback",      icon: "inbox",     href: "/parent/feedback" },
                { id: "notifications", label: "Notifications", icon: "bell",      href: "/parent/notifications" },
            ]},
        ],
    },
};

export interface KitSidebarProps {
    role: Role;
}

export function KitSidebar({ role }: KitSidebarProps) {
    const cfg = NAV_CONFIG[role];
    const pathname = usePathname();
    const router = useRouter();
    const user = useMemo(() => getStoredUser(), []);
    const shell = useShellData();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
        : "U";
    const userName = user
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Guest"
        : "Guest";

    const fallbackMeta =
        role === "admin" ? shell.schoolName :
        role === "teacher" ? "Teacher" :
        role === "student" ? "Student" :
        "Parent";
    const userMeta = shell.userMeta || fallbackMeta;
    const brandSubtitle = `${shell.schoolName} · ${cfg.label}`;

    const onSwitchPortal = () => {
        clearAuth();
        router.push("/");
    };

    const onSignOut = () => {
        clearAuth();
        router.push(`/${role}/login`);
    };

    return (
        <aside className={`kit-shell-sidebar role-${role}`} aria-label={`${cfg.label} navigation`}>
            <div className="sidebar__brand" style={{ position: "relative" }} ref={menuRef}>
                <div className="sidebar__logo">
                    <Icon name="cap" size={13} />
                </div>
                <div className="sidebar__brand-text">
                    <div className="sidebar__brand-name">
                        <span className="sidebar__brand-dot" />
                        TriLink
                    </div>
                    <div className="sidebar__brand-role" title={brandSubtitle}>
                        {brandSubtitle}
                    </div>
                </div>
                <button
                    type="button"
                    className="iconbtn"
                    title="Workspace menu"
                    style={{ width: 22, height: 22 }}
                    aria-label="Workspace menu"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                >
                    <Icon name="chevUpDown" size={12} />
                </button>

                {menuOpen && (
                    <div
                        role="menu"
                        className="k-card"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            right: 8,
                            left: 8,
                            zIndex: 60,
                            padding: 6,
                            display: "grid",
                            gap: 2,
                            boxShadow: "0 8px 24px rgba(15,17,21,0.12)",
                        }}
                    >
                        <button
                            type="button"
                            role="menuitem"
                            className="sidebar__item"
                            style={{ width: "100%" }}
                            onClick={() => {
                                setMenuOpen(false);
                                onSwitchPortal();
                            }}
                        >
                            <Icon name="users" />
                            <span>Switch portal</span>
                        </button>
                        <Link
                            href={`/${role}/settings`}
                            role="menuitem"
                            className="sidebar__item"
                            onClick={() => setMenuOpen(false)}
                        >
                            <Icon name="cog" />
                            <span>Settings</span>
                        </Link>
                        <button
                            type="button"
                            role="menuitem"
                            className="sidebar__item"
                            style={{ width: "100%" }}
                            onClick={() => {
                                setMenuOpen(false);
                                onSignOut();
                            }}
                        >
                            <Icon name="logout" />
                            <span>Sign out</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="sidebar__scroll">
                {cfg.sections.map((section) => (
                    <div key={section.title}>
                        <div className="sidebar__section">{section.title}</div>
                        <div className="sidebar__nav">
                            {section.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
                                const badge = badgeForNavItem(role, item.id, shell);
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`sidebar__item ${isActive ? "active" : ""}`}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <Icon name={item.icon} />
                                        <span>{item.label}</span>
                                        {badge != null && (
                                            <span className={`badge-num ${item.hot ? "hot" : ""}`}>
                                                {badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sidebar__footer">
                <Link
                    href={`/${role}/settings`}
                    className="sidebar__user"
                    title="Account settings"
                >
                    <div className="sidebar__avatar">{initials}</div>
                    <div className="sidebar__user-text">
                        <div className="sidebar__user-name">{userName}</div>
                        <div className="sidebar__user-meta">{userMeta}</div>
                    </div>
                    <Icon name="chevUpDown" size={12} className="chev" />
                </Link>
            </div>
        </aside>
    );
}
