"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * ChatKitPage — real chat surface backed by REST + Socket.IO.
 *
 *  - Conversations: `listConversations` (REST) and updates when a new socket
 *    message arrives.
 *  - Messages: `listMessages` (REST initial), live-appended via `onMessage`.
 *  - Send: REST `postMessage` (server then re-emits on the socket for other
 *    members). The realtime channel is best-effort; UI never blocks on it.
 *  - New chat: `searchChatUsers` + `initiateConversation` to start a direct
 *    conversation with anyone in the school.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon, KAvatar } from "@/components/kit";
import {
    KitDialog,
    KitEmpty,
    KitErrorBanner,
    KitInput,
    KitLoadingBlock,
    KitSpinner,
    KitToast,
} from "@/components/kit/local";
import {
    listConversations,
    listMessages,
    postMessage,
    searchChatUsers,
    initiateConversation,
    type ChatMessage,
    type Conversation,
    type PublicUser,
} from "@/lib/admin-api";
import {
    disconnectChatSocket,
    emitTyping,
    joinConversation,
    leaveConversation,
    onMessage as onSocketMessage,
    onPresence as onSocketPresence,
    onTyping as onSocketTyping,
} from "@/lib/chat-socket";
import { getStoredUser } from "@/lib/auth";

type Role = "admin" | "teacher" | "student" | "parent";

function initialsOf(label: string): string {
    return label
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function dayLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString();
}

function timeShort(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function relTime(iso: string): string {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const s = Math.round(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    return `${d}d`;
}

export function ChatKitPage({ role }: { role: Role }) {
    const me = useMemo(() => getStoredUser(), []);
    const myId = me?.id ?? "";
    const [conversations, setConversations] = useState<Conversation[] | null>(null);
    const [active, setActive] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [filter, setFilter] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [, setOnlineUserIds] = useState<Set<string>>(new Set());
    const [typingByConv, setTypingByConv] = useState<Record<string, Set<string>>>({});
    const [toast, setToast] = useState<{ msg: string; tone?: "success" | "danger" } | null>(null);

    const [newOpen, setNewOpen] = useState(false);
    const [userQuery, setUserQuery] = useState("");
    const [userResults, setUserResults] = useState<PublicUser[]>([]);
    const [userSearching, setUserSearching] = useState(false);

    const threadRef = useRef<HTMLDivElement | null>(null);

    const loadConversations = useCallback(async () => {
        try {
            const list = await listConversations();
            setConversations(list);
            return list;
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load conversations");
            return [];
        }
    }, []);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!active) {
            setMessages([]);
            return;
        }
        setLoadingMsgs(true);
        let cancelled = false;
        void (async () => {
            try {
                const m = await listMessages(active.id);
                if (!cancelled) setMessages(m);
            } catch (e) {
                if (!cancelled) {
                    setErr(e instanceof Error ? e.message : "Failed to load messages");
                }
            } finally {
                if (!cancelled) setLoadingMsgs(false);
            }
        })();
        void joinConversation(active.id);
        return () => {
            cancelled = true;
            void leaveConversation(active.id);
        };
    }, [active]);

    useEffect(() => {
        const offMsg = onSocketMessage((payload) => {
            if (active && payload.conversationId === active.id) {
                setMessages((prev) =>
                    prev.some((m) => m.id === payload.id)
                        ? prev
                        : [
                              ...prev,
                              {
                                  id: payload.id,
                                  conversationId: payload.conversationId,
                                  senderId: payload.senderId,
                                  text: payload.text ?? "",
                                  createdAt: payload.createdAt,
                              },
                          ],
                );
            }
            void loadConversations();
        });
        const offTyping = onSocketTyping((payload) => {
            setTypingByConv((prev) => {
                const set = new Set(prev[payload.conversationId] ?? []);
                if (payload.isTyping) set.add(payload.userId);
                else set.delete(payload.userId);
                return { ...prev, [payload.conversationId]: set };
            });
        });
        const offPresence = onSocketPresence((payload) => {
            setOnlineUserIds((prev) => {
                const next = new Set(prev);
                if (payload.online) next.add(payload.userId);
                else next.delete(payload.userId);
                return next;
            });
        });
        return () => {
            offMsg();
            offTyping();
            offPresence();
        };
    }, [active, loadConversations]);

    useEffect(() => {
        return () => {
            disconnectChatSocket();
        };
    }, []);

    useEffect(() => {
        const el = threadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, active?.id]);

    useEffect(() => {
        if (!newOpen || !userQuery.trim()) {
            setUserResults([]);
            return;
        }
        let cancelled = false;
        setUserSearching(true);
        const t = window.setTimeout(async () => {
            try {
                const r = await searchChatUsers(userQuery.trim());
                if (!cancelled) setUserResults(r);
            } catch {
                if (!cancelled) setUserResults([]);
            } finally {
                if (!cancelled) setUserSearching(false);
            }
        }, 220);
        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [userQuery, newOpen]);

    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q || !conversations) return conversations ?? [];
        return conversations.filter((c) => c.title.toLowerCase().includes(q));
    }, [conversations, filter]);

    const onSend = async () => {
        if (!active || !draft.trim() || sending) return;
        setSending(true);
        const text = draft.trim();
        setDraft("");
        try {
            const sent = await postMessage(active.id, text);
            setMessages((prev) =>
                prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
            );
            void loadConversations();
        } catch (e) {
            setToast({
                msg: e instanceof Error ? e.message : "Failed to send",
                tone: "danger",
            });
            setDraft(text);
        } finally {
            setSending(false);
        }
    };

    const onStartChat = async (user: PublicUser) => {
        try {
            const conv = await initiateConversation({
                recipientId: user.id,
                type: "direct",
                title: `${user.firstName} ${user.lastName}`.trim(),
            });
            setNewOpen(false);
            setUserQuery("");
            const list = await loadConversations();
            const next = list.find((c) => c.id === conv.id) ?? conv;
            setActive(next);
        } catch (e) {
            setToast({
                msg: e instanceof Error ? e.message : "Could not start chat",
                tone: "danger",
            });
        }
    };

    const threadDays: Array<{ key: string; day: string; messages: ChatMessage[] }> = useMemo(() => {
        if (!messages.length) return [];
        const groups: Array<{ key: string; day: string; messages: ChatMessage[] }> = [];
        let current: { key: string; day: string; messages: ChatMessage[] } | null = null;
        for (const m of messages) {
            const d = dayLabel(m.createdAt);
            if (!current || current.day !== d) {
                current = { key: `${d}-${m.id}`, day: d, messages: [m] };
                groups.push(current);
            } else {
                current.messages.push(m);
            }
        }
        return groups;
    }, [messages]);

    const typingHere = active ? Array.from(typingByConv[active.id] ?? []).filter((u) => u !== myId) : [];

    if (err && !conversations) {
        return (
            <div className="kit-page" data-role={role}>
                <KitErrorBanner message={err} />
            </div>
        );
    }

    return (
        <div className="chat-shell" data-role={role}>
            <div className="chat-list">
                <div className="chat-list__h">
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Inbox</div>
                    <button
                        type="button"
                        className="iconbtn"
                        style={{ width: 24, height: 24 }}
                        aria-label="New conversation"
                        onClick={() => setNewOpen(true)}
                    >
                        <Icon name="plus" size={13} />
                    </button>
                </div>
                <div style={{ padding: "6px 10px" }}>
                    <div style={{ position: "relative" }}>
                        <Icon name="search" size={12} className="absolute" />
                        <input
                            placeholder="Search…"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "6px 10px 6px 26px",
                                borderRadius: 7,
                                border: "1px solid var(--hairline)",
                                background: "var(--surface-2)",
                                fontSize: 12.5,
                                outline: "none",
                            }}
                        />
                    </div>
                </div>
                {conversations == null ? (
                    <KitLoadingBlock label="Loading inbox…" />
                ) : filtered.length === 0 ? (
                    <KitEmpty
                        icon={<Icon name="chat" size={20} />}
                        title={filter ? "No matches" : "No conversations yet"}
                        sub={filter ? "Try a different search." : "Start a chat using the + button above."}
                    />
                ) : (
                    filtered.map((c) => (
                        <div
                            key={c.id}
                            className={`chat-item ${active?.id === c.id ? "active" : ""}`}
                            onClick={() => setActive(c)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") setActive(c);
                            }}
                        >
                            <div style={{ position: "relative" }}>
                                <KAvatar
                                    initials={initialsOf(c.title)}
                                    tone={active?.id === c.id ? "filled" : "default"}
                                />
                            </div>
                            <div className="chat-item__b">
                                <div className="chat-item__name">
                                    <b>{c.title}</b>
                                    {c.updatedAt && (
                                        <span className="chat-item__time">{relTime(c.updatedAt)}</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>
                                    {c.type.replace(/^./, (s) => s.toUpperCase())}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-thread">
                {active ? (
                    <>
                        <div className="chat-thread__h">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <KAvatar initials={initialsOf(active.title)} tone="filled" />
                                <div>
                                    <div
                                        style={{
                                            fontSize: 13.5,
                                            fontWeight: 500,
                                            letterSpacing: "-0.005em",
                                        }}
                                    >
                                        {active.title}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                                        {active.type.replace(/^./, (s) => s.toUpperCase())}
                                        {typingHere.length > 0 && (
                                            <>
                                                <span className="dot-sep">·</span>
                                                <span style={{ color: "var(--brand-ink)" }}>typing…</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="chat-thread__body" ref={threadRef}>
                            {loadingMsgs ? (
                                <KitLoadingBlock label="Loading messages…" />
                            ) : messages.length === 0 ? (
                                <div
                                    style={{
                                        padding: 32,
                                        textAlign: "center",
                                        color: "var(--color-ink-mute)",
                                        fontSize: 12.5,
                                    }}
                                >
                                    No messages yet. Say hello!
                                </div>
                            ) : (
                                threadDays.map((g) => (
                                    <div key={g.key}>
                                        <div className="chat-day">— {g.day} —</div>
                                        {g.messages.map((m) => {
                                            const mine = m.senderId === myId;
                                            return (
                                                <div
                                                    key={m.id}
                                                    className={`chat-msg ${mine ? "me" : ""}`}
                                                >
                                                    <div>
                                                        <div className="chat-msg__bubble">
                                                            {m.text}
                                                        </div>
                                                        <div
                                                            className="chat-msg__time"
                                                            style={{
                                                                textAlign: mine ? "right" : "left",
                                                            }}
                                                        >
                                                            {timeShort(m.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="chat-compose">
                            <textarea
                                placeholder="Write a message…"
                                value={draft}
                                onChange={(e) => {
                                    setDraft(e.target.value);
                                    if (active) void emitTyping(active.id, e.target.value.length > 0);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void onSend();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="btn-kit btn-kit-primary"
                                disabled={!draft.trim() || sending}
                                onClick={() => void onSend()}
                            >
                                {sending ? <KitSpinner size={12} /> : <Icon name="send" />} Send
                            </button>
                        </div>
                    </>
                ) : (
                    <KitEmpty
                        icon={<Icon name="chat" size={20} />}
                        title="Select a conversation"
                        sub="Choose a conversation from the inbox or start a new chat."
                    />
                )}
            </div>

            {newOpen && (
                <KitDialog title="Start a new chat" onClose={() => setNewOpen(false)} maxWidth={420}>
                    <KitInput
                        placeholder="Search by name or email…"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        autoFocus
                    />
                    <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 4 }}>
                        {userSearching && (
                            <div style={{ padding: 12, color: "var(--color-ink-mute)", fontSize: 12 }}>
                                Searching…
                            </div>
                        )}
                        {!userSearching && userQuery && userResults.length === 0 && (
                            <div
                                style={{
                                    padding: 12,
                                    color: "var(--color-ink-mute)",
                                    fontSize: 12,
                                }}
                            >
                                No users found.
                            </div>
                        )}
                        {userResults.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => void onStartChat(u)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 10px",
                                    border: "1px solid var(--color-hairline)",
                                    borderRadius: 8,
                                    background: "var(--color-surface)",
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                <KAvatar
                                    initials={initialsOf(`${u.firstName} ${u.lastName}`)}
                                    tone="default"
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                                        {u.firstName} {u.lastName}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "var(--color-ink-mute)" }}>
                                        {u.role} · {u.email}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </KitDialog>
            )}

            {toast && <KitToast message={toast.msg} tone={toast.tone} />}
        </div>
    );
}
