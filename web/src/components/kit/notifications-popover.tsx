"use client";
/* eslint-disable react/forbid-dom-props -- kit ports use inline styles for popover layout. */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/kit";
import { useShellData } from "@/components/kit/ShellDataContext";
import {
    markAllNotificationsRead,
    markNotificationRead,
    type BackendNotification,
} from "@/lib/admin-api";

function formatRelative(iso: string): string {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const s = Math.round(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}

function notifHref(role: string, n: BackendNotification): string {
    const t = (n.type || "").toLowerCase();
    if (t.includes("announcement")) return `/${role}/announcements`;
    if (t.includes("chat") || t.includes("message")) return `/${role}/chat`;
    if (t.includes("exam")) return `/${role}/exams`;
    if (t.includes("assignment")) return `/${role}/assignments`;
    if (t.includes("attendance")) return `/${role}/attendance`;
    if (t.includes("feedback")) return `/${role}/feedback`;
    return `/${role}/notifications`;
}

export function NotificationsButton({ role }: { role: "admin" | "teacher" | "student" | "parent" }) {
    const shell = useShellData();
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const wrapRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const unread = shell.unreadCount;
    const list = shell.notifications.slice(0, 12);

    const onMarkAll = async () => {
        try {
            await markAllNotificationsRead();
            await shell.refreshNotifications();
        } catch {
            /* swallow */
        }
    };

    const onItemClick = async (n: BackendNotification) => {
        setOpen(false);
        if (!n.readAt) {
            try {
                await markNotificationRead(n.id);
                await shell.refreshNotifications();
            } catch {
                /* swallow */
            }
        }
        router.push(notifHref(role, n));
    };

    return (
        <div ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
            <button
                type="button"
                className="iconbtn"
                title="Notifications"
                aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <Icon name="bell" />
                {unread > 0 && <span className="dot" />}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Notifications"
                    className="k-card"
                    style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: 360,
                        maxWidth: "92vw",
                        zIndex: 70,
                        padding: 0,
                        boxShadow: "0 12px 32px rgba(15,17,21,0.16)",
                    }}
                >
                    <div
                        style={{
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid var(--color-hairline)",
                        }}
                    >
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Notifications</div>
                        <button
                            type="button"
                            className="btn-kit btn-kit-ghost"
                            style={{ height: 26, padding: "0 8px", fontSize: 11 }}
                            onClick={onMarkAll}
                            disabled={unread === 0}
                        >
                            Mark all read
                        </button>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                        {list.length === 0 ? (
                            <div
                                style={{
                                    padding: 24,
                                    textAlign: "center",
                                    color: "var(--color-ink-mute)",
                                    fontSize: 12,
                                }}
                            >
                                You&apos;re all caught up.
                            </div>
                        ) : (
                            list.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => void onItemClick(n)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        textAlign: "left",
                                        width: "100%",
                                        padding: "10px 12px",
                                        background: n.readAt ? "transparent" : "var(--color-surface-2)",
                                        borderBottom: "1px solid var(--color-hairline)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "var(--color-ink)",
                                        }}
                                    >
                                        {!n.readAt && (
                                            <span
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: 999,
                                                    background: "var(--color-accent)",
                                                }}
                                            />
                                        )}
                                        <span>{n.title}</span>
                                    </div>
                                    {n.body && (
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--color-ink-mute)",
                                                marginTop: 2,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {n.body}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            fontSize: 10.5,
                                            color: "var(--color-ink-mute)",
                                            marginTop: 4,
                                        }}
                                    >
                                        {formatRelative(n.createdAt)}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    <div
                        style={{
                            padding: "8px 12px",
                            borderTop: "1px solid var(--color-hairline)",
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >
                        <Link
                            href={`/${role}/notifications`}
                            onClick={() => setOpen(false)}
                            style={{ fontSize: 12, color: "var(--color-ink)", textDecoration: "underline" }}
                        >
                            View all
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
