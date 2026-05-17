"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
} from "@/components/shadcn/command";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Calendar,
    Megaphone,
    MessageSquare,
    Bell,
    BookOpen,
    Settings,
    UserCircle,
    Building2,
    BarChart3,
    ClipboardList,
} from "lucide-react";

/**
 * CommandPaletteProvider — global cmd-k navigation.
 *
 * This is the single feature that gives TriLink the keyboard-first feel of
 * Linear, Raycast, Arc, and the Stripe Dashboard. Press ⌘K / Ctrl-K from
 * anywhere to open; type to filter; Enter to navigate.
 *
 * The route list is intentionally derived inline (rather than imported from
 * `role-nav`) so the palette stays role-agnostic — every user sees only the
 * routes their portal exposes via the URL prefix.
 */
type Route = {
    href: string;
    label: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    keywords?: string[];
    role: "admin" | "teacher" | "student" | "parent";
};

const ROUTES: Route[] = [
    // Admin
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, role: "admin" },
    { href: "/admin/students", label: "Students", icon: GraduationCap, role: "admin", keywords: ["learners", "enroll"] },
    { href: "/admin/teachers", label: "Teachers", icon: Users, role: "admin", keywords: ["staff", "faculty"] },
    { href: "/admin/parents", label: "Parents", icon: Users, role: "admin", keywords: ["guardians"] },
    { href: "/admin/classes", label: "Classes", icon: BookOpen, role: "admin" },
    { href: "/admin/school-setup", label: "School setup", icon: Building2, role: "admin", keywords: ["config", "settings"] },
    { href: "/admin/attendance", label: "Attendance", icon: ClipboardList, role: "admin" },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone, role: "admin" },
    { href: "/admin/chat", label: "Chat", icon: MessageSquare, role: "admin" },
    { href: "/admin/audit", label: "Audit log", icon: BarChart3, role: "admin", keywords: ["history", "activity"] },
    { href: "/admin/settings", label: "Settings", icon: Settings, role: "admin" },
    { href: "/admin/profile", label: "Profile", icon: UserCircle, role: "admin" },
    // Teacher
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, role: "teacher" },
    { href: "/teacher/attendance", label: "Attendance", icon: ClipboardList, role: "teacher" },
    { href: "/teacher/students", label: "Students", icon: GraduationCap, role: "teacher" },
    { href: "/teacher/exams", label: "Exams", icon: BookOpen, role: "teacher", keywords: ["quiz", "test"] },
    { href: "/teacher/assignments", label: "Assignments", icon: ClipboardList, role: "teacher" },
    { href: "/teacher/announcements", label: "Announcements", icon: Megaphone, role: "teacher" },
    { href: "/teacher/calendar", label: "Calendar", icon: Calendar, role: "teacher" },
    { href: "/teacher/chat", label: "Chat", icon: MessageSquare, role: "teacher" },
    { href: "/teacher/notifications", label: "Notifications", icon: Bell, role: "teacher" },
    { href: "/teacher/settings", label: "Settings", icon: Settings, role: "teacher" },
    { href: "/teacher/profile", label: "Profile", icon: UserCircle, role: "teacher" },
    // Student
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, role: "student" },
    { href: "/student/chat", label: "Chat", icon: MessageSquare, role: "student" },
    { href: "/student/settings", label: "Settings", icon: Settings, role: "student" },
    { href: "/student/profile", label: "Profile", icon: UserCircle, role: "student" },
    // Parent
    { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard, role: "parent" },
    { href: "/parent/children", label: "My children", icon: Users, role: "parent" },
    { href: "/parent/grades", label: "Grades", icon: BarChart3, role: "parent" },
    { href: "/parent/chat", label: "Chat", icon: MessageSquare, role: "parent" },
    { href: "/parent/settings", label: "Settings", icon: Settings, role: "parent" },
    { href: "/parent/profile", label: "Profile", icon: UserCircle, role: "parent" },
];

function detectRole(): Route["role"] | null {
    if (typeof window === "undefined") return null;
    const seg = window.location.pathname.split("/").filter(Boolean)[0];
    if (seg === "admin" || seg === "teacher" || seg === "student" || seg === "parent") {
        return seg;
    }
    return null;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const role = detectRole();
    const items = role ? ROUTES.filter((r) => r.role === role) : ROUTES;

    return (
        <>
            {children}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search pages, people, classes…" />
                <CommandList>
                    <CommandEmpty>No matches. Try a different keyword.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                        {items.map((item) => {
                            const Icon = item.icon;
                            const value = `${item.label} ${item.href} ${(item.keywords ?? []).join(" ")}`;
                            return (
                                <CommandItem
                                    key={item.href}
                                    value={value}
                                    onSelect={() => {
                                        setOpen(false);
                                        router.push(item.href);
                                    }}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                    <CommandShortcut>{item.href}</CommandShortcut>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
