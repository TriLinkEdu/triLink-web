"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CheckCheck,
  Circle,
  MessageCircle,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import {
  type ChatMessage,
  type Conversation,
  createConversation,
  listConversations,
  listMessages,
  listUsers,
  postMessage,
  type PublicUser,
} from "@/lib/admin-api";
import { getStoredUser } from "@/lib/auth";
import { type RealtimeStatus, chatRealtime } from "@/lib/chat-realtime";

type Props = {
  enableNewGroup?: boolean;
};

type ComposeMode = "private" | "group";
type ConversationFilter = "all" | "private" | "group";
type ConversationWithMembers = Conversation & {
  memberIds?: string[];
  members?: Array<string | { id?: string } | PublicUser>;
};

const POLL_MS = 9000;
const BRAND_BLUE = "#007BFF";

function toLabel(user: PublicUser): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function fmtTime(ts?: string): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDayLabel(ts?: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (same(d, today)) return "Today";
  if (same(d, y)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function ChatSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="chat-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div className="admin-skeleton shimmer" style={{ height: 12, width: 130, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ height: 30, width: "85%", marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ height: 14, width: "70%" }} />
        </div>
        <div className="admin-skeleton shimmer" style={{ height: 30, width: 130, borderRadius: 999 }} />
      </div>
      <div className="chat-layout">
        <div className="card admin-dash-skeleton-block" style={{ minHeight: 560 }}>
          <div className="admin-skeleton shimmer" style={{ height: "100%", borderRadius: 12 }} />
        </div>
        <div className="card admin-dash-skeleton-block" style={{ minHeight: 560 }}>
          <div className="admin-skeleton shimmer" style={{ height: "100%", borderRadius: 12 }} />
        </div>
        <div className="card admin-dash-skeleton-block" style={{ minHeight: 560 }}>
          <div className="admin-skeleton shimmer" style={{ height: "100%", borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

function getConversationMemberIds(conv?: Conversation | null, messages: ChatMessage[] = [], meId?: string) {
  const c = conv as ConversationWithMembers | undefined;
  const ids = new Set<string>();

  if (c?.createdById) ids.add(c.createdById);
  if (meId) ids.add(meId);
  messages.forEach((m) => ids.add(m.senderId));

  c?.memberIds?.forEach((id) => ids.add(id));
  c?.members?.forEach((member) => {
    if (typeof member === "string") ids.add(member);
    else if ("id" in member && member.id) ids.add(member.id);
  });

  return [...ids];
}

export default function RestChat({ enableNewGroup = false }: Props) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("private");
  const [newTitle, setNewTitle] = useState("");
  const [pickMembers, setPickMembers] = useState<string[]>([]);
  const [parentVisible, setParentVisible] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [typingByConv, setTypingByConv] = useState<Record<string, string[]>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [lastReadByUser, setLastReadByUser] = useState<Record<string, string>>({});
  const [lastSeenByConv, setLastSeenByConv] = useState<Record<string, number>>({});
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileFallbackName, setProfileFallbackName] = useState("");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [pendingLiveCount, setPendingLiveCount] = useState(0);

  const me = getStoredUser();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const activeIdRef = useRef("");

  const userMap = useMemo(() => new Map(allUsers.map((u) => [u.id, u])), [allUsers]);
  const activeConv = useMemo(() => convs.find((x) => x.id === activeId), [convs, activeId]);
  const activeTyping = typingByConv[activeId] ?? [];
  const activeMemberIds = useMemo(
    () => getConversationMemberIds(activeConv, msgs, me?.id),
    [activeConv, me?.id, msgs],
  );

  const meLabel = useMemo(() => {
    if (!me) return "You";
    const full = `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim();
    return full || me.email || "You";
  }, [me]);

  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return convs.filter((c) => {
      if (filter !== "all" && c.type !== filter) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [convs, filter, search]);

  const participantsInView = useMemo(() => {
    return activeMemberIds
      .map((id) => {
        if (me?.id === id) {
          return { id, name: meLabel, role: me.role ?? "user", online: true };
        }
        const u = userMap.get(id);
        return u
          ? {
              id: u.id,
              name: toLabel(u),
              role: u.role,
              online: onlineUserIds.includes(u.id),
            }
          : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; role: string; online: boolean }>;
  }, [activeMemberIds, me?.id, me?.role, meLabel, onlineUserIds, userMap]);

  const activeConversationUsers = useMemo(
    () => activeMemberIds.map((id) => (id === me?.id ? null : userMap.get(id) ?? null)).filter(Boolean) as PublicUser[],
    [activeMemberIds, me?.id, userMap],
  );

  const dmParticipant = useMemo(() => {
    if (activeConv?.type !== "private") return null;
    return activeConversationUsers[0] ?? null;
  }, [activeConversationUsers, activeConv?.type]);

  const groupAvatarNames = useMemo(() => {
    const list = activeConversationUsers.map(toLabel);
    return list.slice(0, 4);
  }, [activeConversationUsers]);

  const selectedProfile = useMemo(() => {
    if (!profileUserId) return null;
    if (me?.id === profileUserId) {
      return {
        id: me.id,
        name: meLabel,
        role: me.role ?? "user",
        email: me.email ?? "-",
        phone: "-",
        online: true,
      };
    }
    const fromMap = userMap.get(profileUserId);
    if (fromMap) {
      return {
        id: fromMap.id,
        name: toLabel(fromMap),
        role: fromMap.role,
        email: fromMap.email,
        phone: fromMap.phone ?? "-",
        online: onlineUserIds.includes(fromMap.id),
      };
    }
    return {
      id: profileUserId,
      name: profileFallbackName || `${profileUserId.slice(0, 8)}...`,
      role: "unknown",
      email: "-",
      phone: "-",
      online: onlineUserIds.includes(profileUserId),
    };
  }, [me, meLabel, onlineUserIds, profileFallbackName, profileUserId, userMap]);

  const onlineCount = participantsInView.filter((p) => p.online).length;

  const activeMemberIdSet = useMemo(() => new Set(activeMemberIds), [activeMemberIds]);
  const lastSeenStorageKey = useMemo(() => (me?.id ? `chat:last-seen:${me.id}` : null), [me?.id]);

  const markConversationSeen = useCallback((conversationId: string) => {
    if (!conversationId) return;
    const now = Date.now();
    setLastSeenByConv((prev) => ({ ...prev, [conversationId]: now }));
    setUnreadByConv((prev) => ({ ...prev, [conversationId]: 0 }));
  }, []);

  const isNearBottom = useCallback(() => {
    const el = messageViewportRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 72;
  }, []);

  const loadConvs = useCallback(async () => {
    setErr(null);
    setLoadingConvs(true);
    try {
      const c = await listConversations();
      setConvs(c);
      setActiveId((prev) => {
        if (prev && c.some((x) => x.id === prev)) return prev;
        return c[0]?.id ?? "";
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (!lastSeenStorageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(lastSeenStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object") return;

      const hydrated: Record<string, number> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === "number" && Number.isFinite(value)) hydrated[key] = value;
      });
      setLastSeenByConv(hydrated);
    } catch {
      // Ignore malformed persisted data.
    }
  }, [lastSeenStorageKey]);

  useEffect(() => {
    if (!lastSeenStorageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(lastSeenStorageKey, JSON.stringify(lastSeenByConv));
    } catch {
      // Ignore write failures (private mode/quota).
    }
  }, [lastSeenByConv, lastSeenStorageKey]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      setMsgs([]);
      return;
    }
    setLoadingMsgs(true);
    try {
      const m = await listMessages(conversationId, 100);
      setMsgs([...m].reverse());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    loadConvs();
  }, [loadConvs]);

  useEffect(() => {
    if (!activeId) {
      setMsgs([]);
      return;
    }
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!enableNewGroup) return;
    let cancelled = false;
    (async () => {
      try {
        const [admins, teachers, students, parents] = await Promise.all([
          listUsers("admin"),
          listUsers("teacher"),
          listUsers("student"),
          listUsers("parent"),
        ]);
        if (cancelled) return;
        setAllUsers([...admins, ...teachers, ...students, ...parents]);
      } catch {
        if (!cancelled) setAllUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableNewGroup]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!me?.id) return;
    chatRealtime.connect({ id: me.id, name: meLabel });

    const offStatus = chatRealtime.on("status", (s) => setRealtimeStatus(s));
    const offMsg = chatRealtime.on("message:new", async (payload) => {
      if (!payload?.conversationId || !payload.message?.id) return;
      if (payload.conversationId === activeIdRef.current) {
        setMsgs((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message as ChatMessage];
        });
        window.requestAnimationFrame(() => {
          if (isNearBottom()) {
            setShowJumpToLatest(false);
            setPendingLiveCount(0);
          } else {
            setShowJumpToLatest(true);
            setPendingLiveCount((n) => n + 1);
          }
        });
      } else {
        setUnreadByConv((prev) => ({ ...prev, [payload.conversationId]: (prev[payload.conversationId] ?? 0) + 1 }));
        await loadConvs();
      }
    });
    const offTyping = chatRealtime.on("typing:update", (payload) => {
      if (!payload?.conversationId || !payload?.userId || payload.userId === me.id) return;
      setTypingByConv((prev) => {
        const cur = prev[payload.conversationId] ?? [];
        const next = payload.isTyping ? [...new Set([...cur, payload.userId])] : cur.filter((id) => id !== payload.userId);
        return { ...prev, [payload.conversationId]: next };
      });
    });
    const offPresence = chatRealtime.on("presence:update", (payload) => {
      if (!payload?.userId) return;
      setOnlineUserIds((prev) => {
        if (payload.status === "online") return [...new Set([...prev, payload.userId])];
        return prev.filter((id) => id !== payload.userId);
      });
    });
    const offRead = chatRealtime.on("read:update", (payload) => {
      if (!payload?.userId || !payload?.messageId) return;
      setLastReadByUser((prev) => ({ ...prev, [payload.userId]: payload.messageId }));
    });
    const offConv = chatRealtime.on("conversation:update", async () => {
      await loadConvs();
    });
    const offErr = chatRealtime.on("connection:error", () => {
      setErr("Realtime socket issue. Falling back to REST polling.");
    });

    setRealtimeStatus(chatRealtime.getStatus());

    return () => {
      offStatus();
      offMsg();
      offTyping();
      offPresence();
      offRead();
      offConv();
      offErr();
      chatRealtime.disconnect();
    };
  }, [isNearBottom, loadConvs, me?.id, meLabel]);

  useEffect(() => {
    if (convs.length === 0) return;
    setUnreadByConv((prev) => {
      const next = { ...prev };
      convs.forEach((c) => {
        if (c.id === activeId) {
          next[c.id] = 0;
          return;
        }
        if ((next[c.id] ?? 0) > 0) return;
        const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
        const seen = lastSeenByConv[c.id] ?? 0;
        next[c.id] = updated > seen ? 1 : 0;
      });
      return next;
    });
  }, [activeId, convs, lastSeenByConv]);

  useEffect(() => {
    if (!activeId || !me?.id) return;
    const myId = me.id;
    chatRealtime.joinConversation(activeId, myId);
    markConversationSeen(activeId);
    setShowJumpToLatest(false);
    setPendingLiveCount(0);
    window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    });
    return () => {
      chatRealtime.leaveConversation(activeId, myId);
    };
  }, [activeId, markConversationSeen, me?.id]);

  useEffect(() => {
    const intervalMs = realtimeStatus === "open" ? 22000 : POLL_MS;
    const id = setInterval(() => {
      loadConvs();
      if (activeId) loadMessages(activeId);
    }, intervalMs);
    return () => clearInterval(id);
  }, [activeId, loadConvs, loadMessages, realtimeStatus]);

  useEffect(() => {
    if (!activeId || !me?.id || realtimeStatus !== "open") return;
    const t = window.setTimeout(() => {
      chatRealtime.sendTyping(activeId, me.id!, !!draft.trim());
    }, 250);
    return () => window.clearTimeout(t);
  }, [activeId, draft, me?.id, realtimeStatus]);

  useEffect(() => {
    if (!activeId || !me?.id || !msgs.length || realtimeStatus !== "open") return;
    const last = msgs[msgs.length - 1];
    if (!last?.id) return;
    chatRealtime.sendReadReceipt(activeId, me.id, last.id);
  }, [activeId, me?.id, msgs, realtimeStatus]);

  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last) return;
    if (last.senderId === me?.id || isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowJumpToLatest(false);
      setPendingLiveCount(0);
    }
  }, [isNearBottom, me?.id, msgs]);

  const handleMessagesScroll = useCallback(() => {
    if (isNearBottom()) {
      setShowJumpToLatest(false);
      setPendingLiveCount(0);
      if (activeId) {
        markConversationSeen(activeId);
      }
    }
  }, [activeId, isNearBottom, markConversationSeen]);

  const jumpToLatest = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToLatest(false);
    setPendingLiveCount(0);
    if (activeId) {
      markConversationSeen(activeId);
    }
  }, [activeId, markConversationSeen]);

  const sendMessage = async () => {
    if (!activeId || !draft.trim() || sending) return;
    setSending(true);
    const messageText = draft.trim();
    try {
      await postMessage(activeId, messageText);
      setDraft("");
      if (me?.id && realtimeStatus === "open") {
        chatRealtime.sendTyping(activeId, me.id, false);
      }
      await loadMessages(activeId);
      await loadConvs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const toggleMember = (id: string) => {
    setPickMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedPrivateRecipient = useMemo(() => {
    if (composeMode !== "private") return null;
    return allUsers.find((u) => u.id === pickMembers[0]) ?? null;
  }, [allUsers, composeMode, pickMembers]);

  const createChat = async () => {
    if (!enableNewGroup || creating) return;
    if (composeMode === "private") {
      if (!selectedPrivateRecipient) {
        setErr("Select one recipient for direct chat.");
        return;
      }
      if (me?.id && selectedPrivateRecipient.id === me.id) {
        setErr("You cannot start a direct message with yourself.");
        return;
      }
    } else if (!newTitle.trim() || pickMembers.length === 0) {
      setErr("Group requires a title and at least one member.");
      return;
    }

    setCreating(true);
    try {
      const body =
        composeMode === "private"
          ? {
              type: "private" as const,
              title: toLabel(selectedPrivateRecipient as PublicUser),
              memberIds: [selectedPrivateRecipient!.id],
              parentVisible,
            }
          : {
              type: "group" as const,
              title: newTitle.trim(),
              memberIds: pickMembers,
              parentVisible,
            };

      const conv = await createConversation(body);
      setShowCompose(false);
      setComposeMode("private");
      setNewTitle("");
      setPickMembers([]);
      setParentVisible(false);
      await loadConvs();
      if (conv?.id) {
        setActiveId(conv.id);
        await loadMessages(conv.id);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create conversation");
    } finally {
      setCreating(false);
    }
  };

  if (loadingConvs && convs.length === 0) {
    return <ChatSkeleton />;
  }

  return (
    <div className="page-wrapper">
      <div className="chat-hero">
        <div>
          <p className="chat-kicker">
            <MessageCircle size={14} /> Team Chat
          </p>
          <h1 className="chat-title">Admin Collaboration</h1>
          <p className="chat-subtitle">Manage direct and group conversations with live presence and typing updates.</p>
        </div>
        <div className="chat-hero-right">
          <div className={`chat-rt-pill ${realtimeStatus === "open" ? "online" : "offline"}`}>
            <Circle size={10} fill="currentColor" />
            {realtimeStatus === "open" ? "Realtime active" : "Polling fallback"}
          </div>
          <div className="chat-me-pill">
            <ShieldCheck size={14} /> {meLabel}
          </div>
        </div>
      </div>

      <div className="chat-layout">
        <aside className="chat-list-card card">
          <div className="chat-list-head">
            <h3 className="card-title">Conversations</h3>
            {enableNewGroup ? (
              <button
                type="button"
                onClick={() => setShowCompose(true)}
                className="btn btn-primary"
                style={{ padding: "0.45rem 0.7rem", fontSize: "0.76rem" }}
              >
                <Plus size={13} /> New
              </button>
            ) : null}
          </div>

          <div className="chat-tools-row">
            <label className="chat-search-wrap">
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats..." />
            </label>
            <label className="chat-filter-wrap">
              <MessageCircle size={16} />
              <select value={filter} onChange={(e) => setFilter(e.target.value as ConversationFilter)}>
                <option value="all">All conversations</option>
                <option value="private">Direct messages</option>
                <option value="group">Group chats</option>
              </select>
            </label>
          </div>

          <div className="chat-conv-list">
            {filteredConvs.length === 0 ? (
              <div className="chat-empty-small">No chats found.</div>
            ) : (
              filteredConvs.map((c) => {
                const isActive = c.id === activeId;
                const isUnread = c.id !== activeId && !!c.updatedAt && new Date(c.updatedAt).getTime() > (lastSeenByConv[c.id] ?? 0);
                const title = c.title || "Untitled";
                const convMembers = getConversationMemberIds(c, [], me?.id);
                const isPrivate = c.type === "private";
                const convUsers = convMembers.map((id) => (id === me?.id ? null : userMap.get(id) ?? null)).filter(Boolean) as PublicUser[];
                const primaryUser = convUsers[0] ?? null;
                const labelName = isPrivate ? (primaryUser ? toLabel(primaryUser) : title) : title;
                const threadOnline = isPrivate ? !!(primaryUser && onlineUserIds.includes(primaryUser.id)) : convUsers.some((u) => onlineUserIds.includes(u.id));
                const threadAvatars = (convUsers.length > 0 ? convUsers.map(toLabel) : [title]).slice(0, 4);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveId(c.id);
                      markConversationSeen(c.id);
                    }}
                    className={`chat-conv-item ${isActive ? "active" : ""}`}
                  >
                    <div className="chat-conv-top">
                      <div className="chat-conv-title-wrap">
                        <div className="chat-conv-avatar" aria-hidden="true">
                          {isPrivate ? (
                            <>
                              <span className="chat-avatar-text">{initials(labelName)}</span>
                              <span className={`chat-avatar-status ${threadOnline ? "online" : "offline"}`} />
                            </>
                          ) : (
                            <>
                              <span className="chat-conv-avatar-stack">
                                {threadAvatars.map((name, idx) => (
                                  <span key={`${name}-${idx}`} className="chat-conv-avatar-stack-item" style={{ transform: `translateX(${idx * -6}px)` }}>
                                    {initials(name)}
                                  </span>
                                ))}
                              </span>
                              <span className={`chat-avatar-status ${threadOnline ? "online" : "offline"}`} />
                            </>
                          )}
                        </div>
                        <strong className="chat-conv-title">{labelName}</strong>
                      </div>
                      <span className="chat-conv-time-wrap">
                        <span className="chat-conv-time">{fmtTime(c.updatedAt)}</span>
                        {(unreadByConv[c.id] ?? 0) > 0 ? (
                          <span className="chat-unread-badge">{Math.min(99, unreadByConv[c.id] ?? 0)}</span>
                        ) : isUnread ? (
                          <span className="chat-unread-dot" />
                        ) : null}
                      </span>
                    </div>
                    <div className="chat-conv-bottom" style={{ marginTop: "0.35rem" }}>
                      <span className={`chat-type-pill ${c.type}`}>{c.type === "group" ? "Group" : "Direct"}</span>
                      <span className="chat-last-preview">{c.type === "group" ? `${Math.max(1, convMembers.length)} members` : "1 member"}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="chat-main-card card">
          <div className="chat-main-head">
            <div className="chat-main-title">{activeConv?.type === "private" ? (dmParticipant ? toLabel(dmParticipant) : activeConv?.title ?? "Direct message") : activeConv?.title ?? "Select a conversation"}</div>
            <div className="chat-main-meta">
              {activeConv?.type === "private" ? (
                <span className="text-sm text-gray">Direct message</span>
              ) : (
                <span className="text-sm text-gray">{participantsInView.length} members, {onlineCount} online</span>
              )}
              {activeConv?.parentVisible ? <span className="chat-parent-visible-pill">Parent visible</span> : null}
              <div className="flex items-center gap-1 text-gray" style={{ marginLeft: "auto" }}>
                <button type="button" className="btn-icon" aria-label="Call"><Phone size={15} /></button>
                <button type="button" className="btn-icon" aria-label="Video"><Video size={15} /></button>
              </div>
            </div>
          </div>

          <div ref={messageViewportRef} onScroll={handleMessagesScroll} className="chat-messages-area">
            {!activeConv ? (
              <div className="chat-empty-large">Select a conversation to start messaging.</div>
            ) : loadingMsgs ? (
              <div className="chat-empty-large">Loading messages...</div>
            ) : msgs.length === 0 ? (
              <div className="chat-empty-large">No messages yet.</div>
            ) : (
              <>
                {msgs.map((m, idx) => {
                  const mine = m.senderId === me?.id;
                  const sender = userMap.get(m.senderId);
                  const senderLabel = mine ? "You" : sender ? toLabel(sender) : `${m.senderId.slice(0, 8)}...`;
                  const prev = idx > 0 ? msgs[idx - 1] : null;
                  const next = idx < msgs.length - 1 ? msgs[idx + 1] : null;
                  const sameDayAsPrev = !!prev && new Date(prev.createdAt).toDateString() === new Date(m.createdAt).toDateString();
                  const prevGapMs = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
                  const groupedWithPrev = !!prev && prev.senderId === m.senderId && sameDayAsPrev && prevGapMs < 5 * 60 * 1000;
                  const sameDayAsNext = !!next && new Date(next.createdAt).toDateString() === new Date(m.createdAt).toDateString();
                  const nextGapMs = next ? new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
                  const groupedWithNext = !!next && next.senderId === m.senderId && sameDayAsNext && nextGapMs < 5 * 60 * 1000;
                  const showDayDivider = !prev || !sameDayAsPrev;
                  const showIdentity = !mine && (!groupedWithPrev || activeConv?.type === "group");
                  const showAvatar = !mine && !groupedWithNext;

                  const readByOthers = mine
                    ? Object.entries(lastReadByUser)
                        .filter(([userId, messageId]) => userId !== me?.id && messageId === m.id)
                        .map(([userId]) => userMap.get(userId)?.firstName || userId.slice(0, 4))
                    : [];

                  return (
                    <div key={m.id}>
                      {showDayDivider ? <div className="chat-day-divider">{fmtDayLabel(m.createdAt)}</div> : null}
                      <div className={`chat-bubble-wrap ${mine ? "mine" : "other"} ${groupedWithPrev ? "compact" : ""}`}>
                        {!mine ? (
                          <div className="chat-bubble-avatar-slot">
                            {showAvatar ? (
                              <button
                                type="button"
                                className="chat-participant-avatar chat-bubble-avatar"
                                onClick={() => {
                                  setProfileUserId(m.senderId);
                                  setProfileFallbackName(senderLabel);
                                }}
                              >
                                {initials(senderLabel)}
                                <span className={`chat-avatar-status ${onlineUserIds.includes(m.senderId) ? "online" : "offline"}`} />
                              </button>
                            ) : (
                              <span className="chat-bubble-avatar-placeholder" />
                            )}
                          </div>
                        ) : null}

                        <div className={`chat-bubble ${mine ? "mine" : "other"}`} style={mine ? { backgroundColor: BRAND_BLUE, color: "#fff" } : undefined}>
                          {showIdentity ? (
                            <div className="chat-bubble-meta-top">
                              <button
                                type="button"
                                className="chat-name-btn"
                                onClick={() => {
                                  setProfileUserId(m.senderId);
                                  setProfileFallbackName(senderLabel);
                                }}
                                style={mine ? { color: "rgba(255,255,255,0.95)" } : undefined}
                              >
                                {senderLabel}
                              </button>
                            </div>
                          ) : null}

                          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</p>

                          <div className="chat-bubble-meta-bottom" style={mine ? { color: "rgba(255,255,255,0.85)" } : undefined}>
                            <span>{fmtTime(m.createdAt)}</span>
                            {mine ? <CheckCheck size={11} /> : null}
                          </div>
                          {mine ? (
                            <div className="chat-read-row" style={{ color: "rgba(255,255,255,0.85)" }}>
                              {readByOthers.length > 0 ? `Read by ${readByOthers.join(", ")}` : "Delivered"}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeTyping.length > 0 ? (
                  <div className="chat-typing-line">
                    <span className="chat-typing-dot" />
                    {activeTyping
                      .map((id) => userMap.get(id))
                      .filter(Boolean)
                      .map((u) => u!.firstName || toLabel(u!))
                      .join(", ")} typing...
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </>
            )}
          </div>

          {showJumpToLatest ? (
            <button type="button" className="chat-jump-latest" onClick={jumpToLatest}>
              <ChevronDown size={14} />
              {pendingLiveCount > 0 ? `${pendingLiveCount} new message${pendingLiveCount > 1 ? "s" : ""}` : "Jump to latest"}
            </button>
          ) : null}

          <div className="chat-compose-row">
            <button type="button" className="btn-icon" aria-label="Attach file">
              <Paperclip size={16} />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message"
              disabled={!activeConv || sending}
              rows={1}
              className="chat-input"
              style={{ resize: "none", minHeight: 44 }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!activeConv || sending || !draft.trim()}
              className="btn btn-primary"
              style={{ width: 44, height: 44, borderRadius: "999px", padding: 0, justifyContent: "center" }}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </main>

        <aside className="chat-side-card card">
          <h3 className="chat-side-title">Conversation Details</h3>
          <div className="chat-profile-card">
            <div className={`chat-avatar-wrap ${activeConv?.type === "private" ? "private" : "group"}`}>
              {activeConv?.type === "private" ? (
                <div className="chat-avatar">
                  {initials(dmParticipant ? toLabel(dmParticipant) : activeConv?.title ?? "DM")}
                  <span className={`chat-avatar-status ${dmParticipant && onlineUserIds.includes(dmParticipant.id) ? "online" : "offline"}`} />
                </div>
              ) : (
                <div className="chat-avatar chat-avatar-group">
                  <div className="chat-avatar-group-stack">
                    {(groupAvatarNames.length > 0 ? groupAvatarNames : [activeConv?.title ?? "Team"]).slice(0, 4).map((name, idx) => (
                      <span key={`${name}-${idx}`} className="chat-avatar-group-chip" style={{ transform: `translateX(${idx * -7}px)` }}>
                        {initials(name)}
                      </span>
                    ))}
                  </div>
                  <span className="chat-avatar-status online" />
                </div>
              )}
            </div>
            <div>
              <div className="chat-profile-name">{activeConv?.type === "private" ? (dmParticipant ? toLabel(dmParticipant) : activeConv?.title ?? "Direct message") : activeConv?.title ?? "Team chat"}</div>
              <div className="chat-profile-role">{activeConv?.type === "private" ? "Direct message" : `${participantsInView.length} members`}</div>
            </div>
          </div>

          <div className="chat-side-meta">
            <div>
              <span>Online now</span>
              <strong>{onlineCount}</strong>
            </div>
            <div>
              <span>Realtime</span>
              <strong>{realtimeStatus === "open" ? "Connected" : "Fallback"}</strong>
            </div>
          </div>

          <div className="chat-side-members">
            <h4>{activeConv?.type === "private" ? "Participant" : "Members"}</h4>
            {participantsInView.length === 0 ? (
              <p>No active members.</p>
            ) : (
              participantsInView
                .filter((p) => activeConversationUsers.some((u) => u.id === p.id) || p.id === me?.id || activeMemberIdSet.has(p.id))
                .slice(0, 8)
                .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="chat-participant-row"
                  onClick={() => {
                    setProfileUserId(p.id);
                    setProfileFallbackName(p.name);
                  }}
                >
                  <span className="chat-participant-avatar">
                    {initials(p.name)}
                    <span className={`chat-avatar-status ${p.online ? "online" : "offline"}`} />
                  </span>
                  <span>{p.name}</span>
                  <em>{activeConv?.type === "private" ? "Direct" : p.role}</em>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>

      {err ? (
        <div className="fixed bottom-4 right-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-lg">
          {err}
        </div>
      ) : null}

      {showCompose && enableNewGroup ? (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-profile-pop-head">
              <h3 className="modal-title">Start a Conversation</h3>
              <button type="button" className="btn-icon" onClick={() => setShowCompose(false)} aria-label="Close compose">
                <X size={16} />
              </button>
            </div>

            <div className="chat-compose-type-row">
              <button
                type="button"
                onClick={() => {
                  setComposeMode("private");
                  setNewTitle("");
                  setPickMembers([]);
                }}
                className={`chat-compose-type-btn ${composeMode === "private" ? "active" : ""}`}
              >
                Direct message
              </button>
              <button
                type="button"
                onClick={() => {
                  setComposeMode("group");
                  setPickMembers([]);
                }}
                className={`chat-compose-type-btn ${composeMode === "group" ? "active" : ""}`}
              >
                Group chat
              </button>
            </div>

            {composeMode === "group" ? (
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Group title"
                className="chat-compose-input"
              />
            ) : null}

            <div className="chat-member-picker">
              {allUsers.length === 0 ? (
                <p className="chat-empty-small">Loading users...</p>
              ) : (
                allUsers.map((u) => {
                  const selected = composeMode === "private" ? pickMembers[0] === u.id : pickMembers.includes(u.id);
                  const isSelfPrivateOption = composeMode === "private" && me?.id === u.id;
                  return (
                    <label key={u.id} className="chat-member-option" style={isSelfPrivateOption ? { opacity: 0.55 } : undefined}>
                      <input
                        type={composeMode === "private" ? "radio" : "checkbox"}
                        name="recipient"
                        checked={selected}
                        disabled={isSelfPrivateOption}
                        onChange={() => {
                          if (composeMode === "private") setPickMembers([u.id]);
                          else toggleMember(u.id);
                        }}
                      />
                      <span>{toLabel(u)} {isSelfPrivateOption ? "(You)" : ""}</span>
                      <em>{isSelfPrivateOption ? "self" : u.role}</em>
                    </label>
                  );
                })
              )}
            </div>

            <label className="chat-parent-visible-toggle">
              <input type="checkbox" checked={parentVisible} onChange={(e) => setParentVisible(e.target.checked)} />
              Parent-visible thread
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCompose(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={createChat} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedProfile ? (
        <div className="modal-overlay" onClick={() => setProfileUserId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-profile-pop-head">
              <h3 className="modal-title">Profile</h3>
              <button type="button" className="btn-icon" onClick={() => setProfileUserId(null)} aria-label="Close profile">
                <X size={16} />
              </button>
            </div>

            <div className="chat-profile-pop-card">
              <div className="chat-avatar chat-profile-pop-avatar">{initials(selectedProfile.name)}</div>
              <div>
                <div className="chat-profile-name">{selectedProfile.name}</div>
                <div className="chat-profile-role">{selectedProfile.role}</div>
              </div>
              <strong className={selectedProfile.online ? "chat-online-txt" : "chat-offline-txt"}>
                <Circle size={12} fill="currentColor" /> {selectedProfile.online ? "Online" : "Offline"}
              </strong>
            </div>

            <div className="chat-profile-pop-grid">
              <div>
                <span>Email</span>
                <strong>{selectedProfile.email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedProfile.phone}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span>User ID</span>
                <strong>{selectedProfile.id}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
