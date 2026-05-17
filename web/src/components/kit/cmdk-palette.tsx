"use client";
/* eslint-disable react/forbid-dom-props -- inline styles drive the modal overlay sizing. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Icon } from "@/components/kit";
import { searchAll } from "@/lib/admin-api";

type Role = "admin" | "teacher" | "student" | "parent";

type ResultItem = {
    id: string;
    title: string;
    subtitle?: string;
    href: string;
    type: string;
};

type Group = { type: string; label: string; items: ResultItem[] };

function normalizeResults(raw: unknown, role: Role): Group[] {
    if (!raw || typeof raw !== "object") return [];
    const groups: Group[] = [];
    const r = raw as Record<string, unknown>;
    const sources: Array<[string, unknown]> = Array.isArray(r)
        ? (r as Array<{ type: string; items: unknown[] }>).map((g) => [g.type, g.items])
        : Object.entries(r);

    for (const [type, items] of sources) {
        if (!Array.isArray(items)) continue;
        const normalized = items.map((row): ResultItem | null => {
            if (!row || typeof row !== "object") return null;
            const x = row as Record<string, unknown>;
            const id = typeof x.id === "string" ? x.id : String(x.id ?? "");
            if (!id) return null;
            const title =
                (typeof x.title === "string" && x.title) ||
                (typeof x.name === "string" && x.name) ||
                ([
                    typeof x.firstName === "string" ? x.firstName : "",
                    typeof x.lastName === "string" ? x.lastName : "",
                ]
                    .filter(Boolean)
                    .join(" ")) ||
                "Untitled";
            const subtitle =
                (typeof x.subtitle === "string" && x.subtitle) ||
                (typeof x.email === "string" && x.email) ||
                (typeof x.role === "string" && x.role) ||
                undefined;
            const href = (() => {
                if (typeof x.href === "string") return x.href;
                if (type.includes("user")) return `/${role}/students`;
                if (type.includes("announcement")) return `/${role}/announcements`;
                if (type.includes("exam")) return `/${role}/exams`;
                if (type.includes("class")) return `/${role}/classes`;
                return `/${role}/dashboard`;
            })();
            return { id, title, subtitle, href, type };
        });
        const clean = normalized.filter((x): x is ResultItem => !!x);
        if (clean.length) {
            const label = type
                .replace(/_/g, " ")
                .replace(/^./, (c) => c.toUpperCase());
            groups.push({ type, label, items: clean });
        }
    }
    return groups;
}

const STATIC_PAGES: Record<Role, Array<{ title: string; href: string; sub?: string }>> = {
    admin: [
        { title: "Command center", href: "/admin/dashboard" },
        { title: "Audit log", href: "/admin/audit" },
        { title: "School setup", href: "/admin/school-setup" },
        { title: "Academic structure", href: "/admin/classes" },
        { title: "Curriculum", href: "/admin/curriculum" },
        { title: "Textbooks", href: "/admin/textbooks" },
        { title: "Registration", href: "/admin/registration" },
        { title: "Students", href: "/admin/students" },
        { title: "Teachers", href: "/admin/teachers" },
        { title: "Parents", href: "/admin/parents" },
        { title: "Attendance", href: "/admin/attendance" },
        { title: "Announcements", href: "/admin/announcements" },
        { title: "Feedback", href: "/admin/feedback" },
        { title: "Chat", href: "/admin/chat" },
        { title: "Settings", href: "/admin/settings" },
    ],
    teacher: [
        { title: "Dashboard", href: "/teacher/dashboard" },
        { title: "Classes", href: "/teacher/classes" },
        { title: "Students", href: "/teacher/students" },
        { title: "Attendance", href: "/teacher/attendance" },
        { title: "Assignments", href: "/teacher/assignments" },
        { title: "Exam builder", href: "/teacher/exams" },
        { title: "Live exam monitor", href: "/teacher/exam-monitor" },
        { title: "Grades", href: "/teacher/grades" },
        { title: "Announcements", href: "/teacher/announcements" },
        { title: "Chat", href: "/teacher/chat" },
        { title: "Settings", href: "/teacher/settings" },
    ],
    student: [
        { title: "Dashboard", href: "/student/dashboard" },
        { title: "Courses", href: "/student/courses" },
        { title: "Exams", href: "/student/exams" },
        { title: "Assignments", href: "/student/assignments" },
        { title: "Grades", href: "/student/grades" },
        { title: "Learning path", href: "/student/learning-path" },
        { title: "Textbooks", href: "/student/textbooks" },
        { title: "Announcements", href: "/student/announcements" },
        { title: "Chat", href: "/student/chat" },
        { title: "Settings", href: "/student/settings" },
    ],
    parent: [
        { title: "Dashboard", href: "/parent/dashboard" },
        { title: "Children", href: "/parent/children" },
        { title: "Grades", href: "/parent/grades" },
        { title: "Attendance", href: "/parent/attendance" },
        { title: "Subjects", href: "/parent/subjects" },
        { title: "Teachers", href: "/parent/teachers" },
        { title: "Announcements", href: "/parent/announcements" },
        { title: "Chat", href: "/parent/chat" },
        { title: "Settings", href: "/parent/settings" },
    ],
};

export function CmdkPalette({
    role,
    open,
    onOpenChange,
}: {
    role: Role;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [groups, setGroups] = React.useState<Group[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setQuery("");
            setGroups([]);
            return;
        }
    }, [open]);

    React.useEffect(() => {
        if (!open || !query.trim()) {
            setGroups([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        const timer = window.setTimeout(async () => {
            try {
                const raw = await searchAll(query.trim());
                if (!cancelled) setGroups(normalizeResults(raw, role));
            } catch {
                if (!cancelled) setGroups([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 220);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query, open, role]);

    const onSelect = (href: string) => {
        onOpenChange(false);
        router.push(href);
    };

    if (!open) return null;

    return (
        <div
            role="presentation"
            onClick={(e) => {
                if (e.target === e.currentTarget) onOpenChange(false);
            }}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,17,21,0.42)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: "12vh",
                zIndex: 200,
            }}
        >
            <Command
                label="Global search"
                shouldFilter={false}
                style={{
                    width: "min(640px, 92vw)",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: 10,
                    boxShadow: "0 18px 48px rgba(15,17,21,0.18)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--color-hairline)",
                    }}
                >
                    <Icon name="search" size={13} />
                    <Command.Input
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search pages, users, classes, announcements…"
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: 14,
                            color: "var(--color-ink)",
                        }}
                        autoFocus
                    />
                    <kbd
                        style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            border: "1px solid var(--color-hairline)",
                            borderRadius: 6,
                            color: "var(--color-ink-mute)",
                        }}
                    >
                        Esc
                    </kbd>
                </div>
                <Command.List style={{ maxHeight: 420, overflowY: "auto", padding: 6 }}>
                    {loading && (
                        <div
                            style={{
                                padding: "10px 12px",
                                color: "var(--color-ink-mute)",
                                fontSize: 12,
                            }}
                        >
                            Searching…
                        </div>
                    )}

                    {!loading && query.trim() && groups.length === 0 && (
                        <Command.Empty style={{ padding: "10px 12px", color: "var(--color-ink-mute)", fontSize: 12 }}>
                            No results for &quot;{query}&quot;
                        </Command.Empty>
                    )}

                    {!query.trim() && (
                        <Command.Group
                            heading="Jump to"
                            style={{ fontSize: 11, color: "var(--color-ink-mute)" }}
                        >
                            {STATIC_PAGES[role].map((p) => (
                                <Command.Item
                                    key={p.href}
                                    value={p.title}
                                    onSelect={() => onSelect(p.href)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 10px",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontSize: 13,
                                        color: "var(--color-ink)",
                                    }}
                                >
                                    <Icon name="chev" size={12} />
                                    <span>{p.title}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    {groups.map((g) => (
                        <Command.Group
                            key={g.type}
                            heading={g.label}
                            style={{ fontSize: 11, color: "var(--color-ink-mute)" }}
                        >
                            {g.items.map((it) => (
                                <Command.Item
                                    key={`${g.type}-${it.id}`}
                                    value={`${g.type} ${it.title} ${it.subtitle ?? ""}`}
                                    onSelect={() => onSelect(it.href)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        gap: 2,
                                        padding: "8px 10px",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        color: "var(--color-ink)",
                                    }}
                                >
                                    <div style={{ fontSize: 13 }}>{it.title}</div>
                                    {it.subtitle && (
                                        <div style={{ fontSize: 11, color: "var(--color-ink-mute)" }}>
                                            {it.subtitle}
                                        </div>
                                    )}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    ))}
                </Command.List>
            </Command>
        </div>
    );
}
