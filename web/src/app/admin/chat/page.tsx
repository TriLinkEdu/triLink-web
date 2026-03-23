"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatParticipant, Conversation, fmtTime, fmtTs, useChatStore } from "@/store/chatStore";

const ME: ChatParticipant = { id: "admin-1", name: "Admin Office", role: "admin", initials: "AO" };

type Filter = "all" | "private" | "group";

const ROLE_COLOR: Record<string, string> = {
    teacher: "#3b82f6",
    student: "#10b981",
    admin: "#f59e0b",
    parent: "#7c3aed",
};

const ROLE_BG: Record<string, string> = {
    teacher: "#eff6ff",
    student: "#dcfce7",
    admin: "#fef3c7",
    parent: "#ede9fe",
};

const STAFF: ChatParticipant[] = [
    { id: "teacher-1", name: "Mr. Solomon", role: "teacher", initials: "MS" },
    { id: "teacher-2", name: "Ms. Tigist", role: "teacher", initials: "MT" },
    { id: "teacher-3", name: "Mr. Habtamu", role: "teacher", initials: "MH" },
];

const IconSend = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" x2="11" y1="2" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" x2="6" y1="6" y2="18" />
        <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
);

function getQuickProfile(participant: ChatParticipant, conversation?: Conversation) {
    const sectionMeta = conversation?.section ? `Grade ${conversation.section}` : "School Portal";
    return {
        name: participant.name,
        roleLabel: participant.role.charAt(0).toUpperCase() + participant.role.slice(1),
        summary: `${participant.name} is available for school communication and role-specific coordination.`,
        email: `${participant.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@trilink.edu`,
        phone: "+251 900 000 000",
        meta: [sectionMeta, "Chat enabled", `Role: ${participant.role}`],
    };
}

export default function AdminChat() {
    const {
        conversations,
        sendMessage,
        markConversationRead,
        createPrivateConversation,
    } = useChatStore();

    const [filter, setFilter] = useState<Filter>("all");
    const [activeId, setActiveId] = useState("");
    const [draft, setDraft] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatTarget, setNewChatTarget] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<{ participant: ChatParticipant; conversation?: Conversation } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const myConvs = useMemo(
        () => conversations.filter((c) => c.participants.some((p) => p.id === ME.id)),
        [conversations]
    );

    const filteredConvs = useMemo(
        () => myConvs.filter((c) => filter === "all" || c.type === filter),
        [filter, myConvs]
    );

    const active = useMemo(
        () => myConvs.find((c) => c.id === activeId),
        [activeId, myConvs]
    );

    useEffect(() => {
        if (filteredConvs.length === 0) {
            if (activeId) setActiveId("");
            return;
        }
        if (!activeId || !filteredConvs.some((c) => c.id === activeId)) {
            setActiveId(filteredConvs[0].id);
        }
    }, [filteredConvs, activeId]);

    useEffect(() => {
        if (activeId) markConversationRead(activeId);
    }, [activeId, markConversationRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeId, active?.messages.length]);

    const unreadCount = useMemo(
        () =>
            filteredConvs.filter((c) => {
                const last = c.messages[c.messages.length - 1];
                if (!last) return false;
                return last.senderId !== ME.id && c.id !== activeId;
            }).length,
        [filteredConvs, activeId]
    );

    const unreadByFilter = useMemo(() => {
        const base = myConvs.filter((c) => {
            const last = c.messages[c.messages.length - 1];
            if (!last) return false;
            return last.senderId !== ME.id && c.id !== activeId;
        });
        return {
            all: base.length,
            private: base.filter((c) => c.type === "private").length,
            group: base.filter((c) => c.type === "group").length,
        };
    }, [myConvs, activeId]);
    const selectedProfileData = selectedProfile
        ? getQuickProfile(selectedProfile.participant, selectedProfile.conversation)
        : null;

    function getOther(conv: Conversation): ChatParticipant | undefined {
        return conv.participants.find((p) => p.id !== ME.id);
    }

    function getConversationAccent(conv: Conversation) {
        if (conv.type === "group") return "#0f766e";
        const other = getOther(conv);
        return ROLE_COLOR[other?.role ?? "teacher"];
    }

    function handleSend() {
        if (!draft.trim() || !activeId) return;
        sendMessage(activeId, {
            senderId: ME.id,
            senderName: ME.name,
            senderRole: ME.role,
            text: draft.trim(),
        });
        setDraft("");
    }

    function startNewPrivateChat(person: ChatParticipant) {
        const convId = createPrivateConversation({
            sender: ME,
            recipient: person,
            initialText: "Hello. I would like to discuss an academic update.",
            parentVisible: false,
        });
        setShowNewChat(false);
        setFilter("all");
        setActiveId(convId);
    }

    return (
        <div className="page-wrapper" style={{ padding: 0, height: "calc(100vh - 64px)", background: "#f3f4f6" }}>
            <div className="chat-layout">
                <div className="chat-sidebar" style={{ background: "#fff" }}>
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Admin Messages</h2>
                            <button className="btn btn-sm" style={{ background: "#2563eb", color: "#fff", border: "1px solid #2563eb", borderRadius: "4px" }} onClick={() => setShowNewChat(true)}>+ New Chat</button>
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            {([
                                { key: "all", label: `All (${unreadByFilter.all})` },
                                { key: "private", label: `Private (${unreadByFilter.private})` },
                                { key: "group", label: `Group (${unreadByFilter.group})` },
                            ] as const).map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                    className="btn btn-sm"
                                    style={
                                        filter === item.key
                                            ? { background: "#2563eb", color: "#fff", border: "1px solid #2563eb" }
                                            : { background: "#fff", color: "#4b5563", border: "1px solid #d1d5db" }
                                    }
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: "0.6rem" }}>
                            {filteredConvs.length} conversation{filteredConvs.length !== 1 ? "s" : ""} • {unreadCount} unread
                        </p>
                    </div>

                    <div className="chat-list">
                        {filteredConvs.length === 0 && (
                            <div style={{ padding: "2rem 1.25rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.8rem" }}>
                                No conversations found
                            </div>
                        )}

                        {filteredConvs.map((conv) => {
                            const other = getOther(conv);
                            const accent = getConversationAccent(conv);
                            const lastMsg = conv.messages[conv.messages.length - 1];
                            const isActive = conv.id === activeId;
                            const isUnread = !!lastMsg && lastMsg.senderId !== ME.id && !isActive;
                            return (
                                <div
                                    key={conv.id}
                                    className="chat-list-item"
                                    onClick={() => setActiveId(conv.id)}
                                    style={{
                                        borderRadius: 14,
                                        margin: "0.35rem 0.55rem",
                                        border: isActive ? `1px solid ${accent}` : "1px solid transparent",
                                        background: isActive ? `${accent}15` : isUnread ? `${accent}05` : "#fff",
                                        borderLeft: isActive ? `4px solid ${accent}` : "4px solid transparent",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const p = conv.type === "private" ? other : conv.participants.find((pp) => pp.id !== ME.id);
                                            if (p) setSelectedProfile({ participant: p, conversation: conv });
                                        }}
                                        style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                                    >
                                        <div
                                            className="avatar avatar-initials"
                                            style={{
                                                width: 40,
                                                height: 40,
                                                fontSize: "0.72rem",
                                                flexShrink: 0,
                                                background: conv.type === "group"
                                                    ? "linear-gradient(135deg, #0f766e, #14b8a6)"
                                                    : `linear-gradient(135deg, ${ROLE_COLOR[other?.role ?? "teacher"]}, ${ROLE_COLOR[other?.role ?? "teacher"]}bb)`,
                                            }}
                                        >
                                            {conv.type === "group" ? (conv.section ?? "GR") : (other?.initials ?? "?")}
                                        </div>
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                            <span style={{ fontWeight: 700, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--gray-900)" }}>
                                                {conv.title}
                                            </span>
                                            <span style={{ fontSize: "0.68rem", color: "var(--gray-400)", flexShrink: 0 }}>
                                                {fmtTs(conv.lastTs)}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                            {conv.type === "group" && (
                                                <span style={{ fontSize: "0.62rem", background: "#ccfbf1", color: "#0f766e", borderRadius: "999px", padding: "2px 7px", fontWeight: 700, flexShrink: 0 }}>
                                                    GROUP
                                                </span>
                                            )}
                                            {conv.type === "private" && other && (
                                                <span
                                                    style={{
                                                        fontSize: "0.62rem",
                                                        background: ROLE_BG[other.role],
                                                        color: ROLE_COLOR[other.role],
                                                        borderRadius: "999px",
                                                        padding: "2px 7px",
                                                        fontWeight: 700,
                                                        flexShrink: 0,
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {other.role}
                                                </span>
                                            )}
                                            <span style={{ fontSize: "0.78rem", color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {lastMsg?.text ?? "No messages yet"}
                                            </span>
                                        </div>
                                    </div>
                                    {isUnread && (
                                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {active ? (() => {
                    const activeAccent = getConversationAccent(active);
                    return (
                    <div className="chat-main">
                        <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {(() => {
                                const other = active.participants.find((p) => p.id !== ME.id);
                                return (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const p = active.type === "private" ? other : active.participants.find((pp) => pp.id !== ME.id);
                                                if (p) setSelectedProfile({ participant: p, conversation: active });
                                            }}
                                            style={{ border: "none", background: "transparent", padding: 0, display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                                        >
                                            <div
                                                className="avatar avatar-initials"
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    fontSize: "0.72rem",
                                                    background: active.type === "group"
                                                        ? "linear-gradient(135deg, #0f766e, #14b8a6)"
                                                        : `linear-gradient(135deg, ${ROLE_COLOR[other?.role ?? "teacher"]}, ${ROLE_COLOR[other?.role ?? "teacher"]}bb)`,
                                                }}
                                            >
                                                {active.type === "group" ? (active.section ?? "GR") : (other?.initials ?? "?")}
                                            </div>
                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ fontWeight: 700, color: "var(--gray-900)" }}>{active.title}</div>
                                                <div style={{ fontSize: "0.74rem", color: "var(--gray-500)" }}>
                                                    {active.type === "group"
                                                        ? `${active.participants.length} participants`
                                                        : `Private conversation with ${other?.name ?? "participant"}`}
                                                </div>
                                            </div>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="chat-messages" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" }}>
                            {active.messages.map((msg) => {
                                const isMe = msg.senderId === ME.id;
                                return (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.3rem" }}>
                                        <div style={{ maxWidth: "72%" }}>
                                            {!isMe && active.type === "group" && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const p = active.participants.find((pp) => pp.id === msg.senderId);
                                                        if (p) setSelectedProfile({ participant: p, conversation: active });
                                                    }}
                                                    style={{ fontSize: "0.68rem", color: "var(--gray-500)", marginBottom: 4, paddingLeft: 2, border: "none", background: "transparent", cursor: "pointer" }}
                                                >
                                                    {msg.senderName}
                                                </button>
                                            )}
                                            <div
                                                style={{
                                                    padding: "0.7rem 0.9rem",
                                                    borderRadius: isMe ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                                                    background: isMe ? activeAccent : "#ffffff",
                                                    color: isMe ? "#fff" : "var(--gray-800)",
                                                    fontSize: "0.875rem",
                                                    lineHeight: 1.5,
                                                    border: isMe ? `1px solid ${activeAccent}` : "1px solid rgba(148,163,184,0.3)",
                                                    boxShadow: isMe ? "none" : "0 4px 12px rgba(15, 23, 42, 0.05)",
                                                }}
                                            >
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", marginTop: 4, textAlign: isMe ? "right" : "left" }}>
                                                {fmtTime(msg.ts)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-area">
                            <input
                                className="chat-input"
                                placeholder="Type a message..."
                                value={draft}
                                style={{ borderRadius: "var(--radius-full)" }}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <button
                                className="btn btn-icon"
                                style={{ borderRadius: "var(--radius-full)", flexShrink: 0, background: activeAccent, color: "#ffffff", border: "none", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                onClick={handleSend}
                                disabled={!draft.trim()}
                            >
                                <IconSend />
                            </button>
                        </div>
                    </div>
                    );
                })() : (
                    <div className="chat-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <h3 style={{ fontWeight: 600 }}>Select a conversation</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Choose a message from the sidebar to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {showNewChat && (
                <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
                    <div className="modal" style={{ maxWidth: 420, width: "92%" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontWeight: 700 }}>Start New Conversation</h3>
                            <button className="btn-icon" onClick={() => setShowNewChat(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" x2="6" y1="6" y2="18" />
                                    <line x1="6" x2="18" y1="6" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--gray-700)" }}>Select Recipient</label>
                                <div style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                                    {STAFF.map((person, idx) => {
                                        const exists = myConvs.some(
                                            (c) => c.type === "private" && c.participants.some((p) => p.id === person.id)
                                        );
                                        const isSelected = newChatTarget === person.id;
                                        return (
                                            <label
                                                key={person.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    padding: "0.6rem 1rem",
                                                    cursor: exists ? "default" : "pointer",
                                                    borderBottom: idx < STAFF.length - 1 ? "1px solid var(--gray-100)" : "none",
                                                    background: isSelected ? "var(--primary-50)" : exists ? "var(--gray-50)" : "#fff",
                                                    opacity: exists ? 0.6 : 1,
                                                    margin: 0
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="newChatRecipient"
                                                    disabled={exists}
                                                    checked={isSelected}
                                                    onChange={() => setNewChatTarget(person.id)}
                                                    style={{ display: exists ? "none" : "block", width: "auto", margin: 0 }}
                                                />
                                                <div className="avatar avatar-initials" style={{ width: 28, height: 28, fontSize: "0.65rem", flexShrink: 0, background: `linear-gradient(135deg, ${ROLE_COLOR[person.role]}, ${ROLE_COLOR[person.role]}bb)` }}>
                                                    {person.initials}
                                                </div>
                                                <div style={{ flex: 1, lineHeight: 1.3 }}>
                                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--gray-900)" }}>{person.name}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "var(--gray-500)", textTransform: "capitalize" }}>
                                                        {person.role}
                                                    </div>
                                                </div>
                                                {exists && <span style={{ fontSize: "0.72rem", color: "var(--gray-400)", fontWeight: 500 }}>Existing</span>}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "1.25rem", borderTop: "1px solid var(--gray-100)" }}>
                            <button className="btn btn-ghost" onClick={() => setShowNewChat(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                disabled={!newChatTarget}
                                onClick={() => {
                                    const person = STAFF.find((p) => p.id === newChatTarget);
                                    if (person) {
                                        startNewPrivateChat(person);
                                        setNewChatTarget("");
                                    }
                                }}
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProfile && selectedProfileData && (
                <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
                    <div className="modal" style={{ maxWidth: 420, width: "90%", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ height: 96, background: `linear-gradient(135deg, ${ROLE_COLOR[selectedProfile.participant.role]}, ${ROLE_COLOR[selectedProfile.participant.role]}cc)` }} />
                        <div style={{ padding: "0 1.25rem 1.25rem", marginTop: -30 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                                <div className="avatar avatar-initials" style={{ width: 64, height: 64, fontSize: "1rem", border: "4px solid #fff", background: `linear-gradient(135deg, ${ROLE_COLOR[selectedProfile.participant.role]}, ${ROLE_COLOR[selectedProfile.participant.role]}bb)` }}>
                                    {selectedProfile.participant.initials}
                                </div>
                                <button
                                    className="btn-icon"
                                    onClick={() => setSelectedProfile(null)}
                                    style={{
                                        marginTop: "0.75rem",
                                        color: "#0f172a",
                                        background: "#f8fafc",
                                        border: "1px solid #cbd5e1",
                                    }}
                                >
                                    <IconClose />
                                </button>
                            </div>
                            <div style={{ marginTop: "0.75rem" }}>
                                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gray-900)" }}>{selectedProfileData.name}</div>
                                <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, padding: "0.25rem 0.65rem", borderRadius: 999, background: ROLE_BG[selectedProfile.participant.role], color: ROLE_COLOR[selectedProfile.participant.role], fontSize: "0.72rem", fontWeight: 700 }}>
                                    {selectedProfileData.roleLabel}
                                </div>
                                <p style={{ marginTop: "0.9rem", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--gray-600)" }}>{selectedProfileData.summary}</p>
                            </div>
                            <div style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}>
                                <div style={{ padding: "0.75rem 0.9rem", borderRadius: 12, background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</div>
                                    <div style={{ marginTop: 4, fontSize: "0.84rem", fontWeight: 600, color: "var(--gray-800)" }}>{selectedProfileData.email}</div>
                                </div>
                                <div style={{ padding: "0.75rem 0.9rem", borderRadius: 12, background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Phone</div>
                                    <div style={{ marginTop: 4, fontSize: "0.84rem", fontWeight: 600, color: "var(--gray-800)" }}>{selectedProfileData.phone}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "1rem" }}>
                                {selectedProfileData.meta.map((item) => (
                                    <span key={item} style={{ padding: "0.35rem 0.65rem", borderRadius: 999, background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.72rem", fontWeight: 600 }}>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
