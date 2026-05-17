"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, useMemo } from "react";
import { Menu, X, GraduationCap, ArrowLeftRight } from "lucide-react";
import { LiveChip } from "@/components/kit/atoms";
import AuthenticatedAvatar from "@/components/AuthenticatedAvatar";
import { getStoredUser, clearAuth } from "@/lib/auth";

export interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    badge?: number;
    section?: string;
}

interface SidebarProps {
    role: string;
    items: NavItem[];
    /**
     * @deprecated kept for compatibility — role color is no longer a
     * decoration. Brand color appears only on the role-tinted logo square,
     * the role primary CTA in the header, and a single page-meta dot.
     */
    roleColor?: string;
}

/**
 * Sidebar — TRILINK kit shell.
 *
 *   - 224 px width, warm off-white surface, single hairline right border
 *   - Brand block (top): 26 px role-tinted logo square + "TriLink" name +
 *     role label below
 *   - Live · synced chip directly under the brand block
 *   - Section labels (10.5 px uppercase, ink-3)
 *   - Footer: hairline-bordered "Secure session / synced" status card,
 *     then a 32 px "Switch portal" secondary button
 *
 * Public API is unchanged so dashboard layouts (admin/teacher/student/parent)
 * keep working without modification.
 */
export default function Sidebar(props: SidebarProps) {
    return <SidebarInner {...props} />;
}

function SidebarInner({ role, items }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const roleNormalized = role.toLowerCase();
    const validRole = ["student", "teacher", "admin", "parent"].includes(roleNormalized)
        ? roleNormalized
        : "student";

    const user = useMemo(() => getStoredUser(), [pathname]);

    const sectionByIndex = items.map((item, index) => {
        const previousSection = index > 0 ? items[index - 1]?.section : undefined;
        return item.section && item.section !== previousSection ? item.section : null;
    });

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileOpen(false);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const dashboardHref = `/${roleNormalized}/dashboard`;
    const roleDisplay = roleNormalized === "admin" ? "Administrator" : roleNormalized.toUpperCase();

    const handleSwitchPortal = () => {
        clearAuth();
        router.push("/");
    };

    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
        : "U";
    const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Guest";

    return (
        <>
            <button
                type="button"
                className="sidebar-mobile-toggle"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileOpen}
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {mobileOpen ? (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden
                />
            ) : null}

            <aside
                className={`sidebar ${mobileOpen ? "open" : ""}`}
                data-role={validRole}
                aria-label={`${role} navigation`}
            >
                {/* Brand block — role-tinted logo square, name, role label */}
                <div className="sidebar-header">
                    <Link
                        href="/"
                        aria-label="Go to home"
                        className="flex items-center gap-2.5 no-underline text-inherit"
                    >
                        <span
                            className="sidebar-logo flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] text-white"
                            aria-hidden
                        >
                            <GraduationCap size={14} strokeWidth={1.8} />
                        </span>
                        <span className="flex min-w-0 flex-col leading-[1.15]">
                            <span className="sidebar-brand">TriLink</span>
                            <span className="sidebar-portal-label">{roleDisplay}</span>
                        </span>
                    </Link>
                </div>

                {/* Live · synced chip — kit's status strip */}
                <div className="px-[14px] pt-1.5 pb-2">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full border bg-[var(--color-success-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-success)]"
                        style={{ borderColor: "rgba(13,138,95,0.16)" }}
                    >
                        <span
                            aria-hidden
                            className="size-[5px] rounded-full bg-[var(--color-success)]"
                        />
                        Live · synced
                    </span>
                </div>

                <nav className="sidebar-nav" aria-label="Main">
                    {items.map((item, i) => {
                        const sectionLabel = sectionByIndex[i];
                        const isActive =
                            pathname === item.href ||
                            (item.href !== dashboardHref && pathname.startsWith(item.href));

                        return (
                            <div key={`${item.href}-${i}`}>
                                {sectionLabel ? (
                                    <div className="sidebar-section">{sectionLabel}</div>
                                ) : null}
                                <Link
                                    href={item.href}
                                    className={`nav-item ${isActive ? "active" : ""}`}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                    {item.badge && item.badge > 0 ? (
                                        <span className="nav-badge">{item.badge}</span>
                                    ) : null}
                                </Link>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer: secure-session status card + Switch portal button */}
                <div className="sidebar-footer p-2">
                    <div
                        className="mb-2 rounded-[8px] border px-3 py-2"
                        style={{
                            borderColor: "var(--color-hairline)",
                            background: "var(--color-bg)",
                        }}
                    >
                        <LiveChip className="!text-[12px] !text-[var(--color-ink)] !font-medium">
                            Secure session
                        </LiveChip>
                        <div className="mt-0.5 text-[11px] text-[var(--color-ink-3)]">
                            Synced with school data · 2s ago
                        </div>
                    </div>

                    <div
                        className="mb-2 flex items-center gap-2 rounded-[6px] px-2 py-1.5 hover:bg-[rgba(15,16,18,0.04)]"
                        title={userName}
                    >
                        <AuthenticatedAvatar
                            fileId={user?.profileImageFileId}
                            initials={initials}
                            size={22}
                            alt={userName}
                        />
                        <div className="flex min-w-0 flex-1 flex-col leading-[1.2]">
                            <span className="truncate text-[12.5px] font-medium text-[var(--color-ink)]">
                                {userName}
                            </span>
                            <span className="truncate text-[11px] text-[var(--color-ink-3)]">
                                {user?.email ?? roleDisplay}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSwitchPortal}
                        className="flex w-full items-center justify-center gap-1.5 rounded-[7px] border bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
                        style={{ borderColor: "var(--color-hairline)" }}
                    >
                        <ArrowLeftRight size={13} strokeWidth={1.8} />
                        Switch portal
                    </button>
                </div>
            </aside>
        </>
    );
}
