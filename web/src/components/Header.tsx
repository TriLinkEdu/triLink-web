"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
    userName: string;
    userRole: string;
    userInitials: string;
    userProfileHref?: string;
}

export default function Header({ userName, userRole, userInitials, userProfileHref }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchText, setSearchText] = useState("");

    const role = pathname.split("/").filter(Boolean)[0] ?? "";

    const quickActionRoutes: Record<string, { notifications?: string; messages?: string }> = {
        teacher: { notifications: "/teacher/notifications", messages: "/teacher/chat" },
        admin: { notifications: "/admin/announcements", messages: "/admin/chat" },
        student: { messages: "/student/chat" },
        parent: { messages: "/parent/chat" },
    };

    const notificationsHref = quickActionRoutes[role]?.notifications;
    const messagesHref = quickActionRoutes[role]?.messages;

    const roleRoutes: Record<string, Array<{ href: string; keywords: string[] }>> = {
        teacher: [
            { href: "/teacher/dashboard", keywords: ["dashboard", "home", "overview"] },
            { href: "/teacher/attendance", keywords: ["attendance", "present", "absent"] },
            { href: "/teacher/announcements", keywords: ["announcement", "announcements", "notice"] },
            { href: "/teacher/exams", keywords: ["exam", "exams", "quiz", "bank", "grade"] },
            { href: "/teacher/students", keywords: ["student", "students", "learner"] },
            { href: "/teacher/notifications", keywords: ["notification", "notifications", "alerts"] },
            { href: "/teacher/chat", keywords: ["chat", "message", "messages", "conversation"] },
            { href: "/teacher/calendar", keywords: ["calendar", "event", "events", "schedule"] },
            { href: "/teacher/settings", keywords: ["setting", "settings", "security", "password", "2fa"] },
            { href: "/teacher/profile", keywords: ["profile", "account"] },
        ],
        admin: [
            { href: "/admin/dashboard", keywords: ["dashboard", "home", "overview"] },
            { href: "/admin/students", keywords: ["student", "students"] },
            { href: "/admin/teachers", keywords: ["teacher", "teachers", "staff"] },
            { href: "/admin/parents", keywords: ["parent", "parents", "guardian"] },
            { href: "/admin/attendance", keywords: ["attendance", "present", "absent"] },
            { href: "/admin/announcements", keywords: ["announcement", "announcements", "notice"] },
            { href: "/admin/classes", keywords: ["class", "classes"] },
            { href: "/admin/registration", keywords: ["registration", "register", "enroll"] },
            { href: "/admin/feedback", keywords: ["feedback", "review"] },
            { href: "/admin/settings", keywords: ["setting", "settings", "security"] },
            { href: "/admin/profile", keywords: ["profile", "account"] },
        ],
        student: [
            { href: "/student/dashboard", keywords: ["dashboard", "home", "overview"] },
            { href: "/student/chat", keywords: ["chat", "message", "messages"] },
            { href: "/student/login", keywords: ["login", "sign in"] },
        ],
        parent: [
            { href: "/parent/chat", keywords: ["chat", "message", "messages"] },
        ],
    };

    function getSearchTarget(query: string) {
        const q = query.trim().toLowerCase();
        if (!q) return null;
        const routes = roleRoutes[role] ?? [];
        for (const item of routes) {
            if (item.keywords.some((kw) => kw.includes(q) || q.includes(kw))) {
                return item.href;
            }
        }
        return null;
    }

    function submitSearch() {
        const target = getSearchTarget(searchText);
        if (!target) {
            window.alert("No matching page found for your search.");
            return;
        }
        router.push(target);
    }

    const userBlock = (
        <div className="header-user">
            <div className="header-user-info">
                <div className="header-user-name">{userName}</div>
                <div className="header-user-role">{userRole}</div>
            </div>
            <div className="avatar avatar-initials" style={{ width: 36, height: 36, fontSize: "0.8rem" }}>
                {userInitials}
            </div>
        </div>
    );

    return (
        <header className="top-header">
            <div className="header-search">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submitSearch();
                        }
                    }}
                />
            </div>

            <div className="header-actions">
                {notificationsHref ? (
                    <Link href={notificationsHref} className="header-icon-btn" title="Notifications" aria-label="Open notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="notification-dot"></span>
                    </Link>
                ) : (
                    <button className="header-icon-btn" title="Notifications" type="button" aria-disabled="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="notification-dot"></span>
                    </button>
                )}

                {messagesHref ? (
                    <Link href={messagesHref} className="header-icon-btn" title="Messages" aria-label="Open chat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </Link>
                ) : (
                    <button className="header-icon-btn" title="Messages" type="button" aria-disabled="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                )}

                {userProfileHref ? <Link href={userProfileHref}>{userBlock}</Link> : userBlock}
            </div>
        </header>
    );
}
