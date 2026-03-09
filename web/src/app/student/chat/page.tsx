"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore, fmtTs, fmtTime, ChatParticipant } from "@/store/chatStore";

const ME: ChatParticipant = { id: "student-1", name: "Abebe Kebede", role: "student", initials: "AK" };

const IconSend = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const IconUsers = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ROLE_COLOR: Record<string, string> = {
    teacher: "var(--primary-500)",
    student: "var(--success)",
    admin: "var(--warning)",
    parent: "#7c3aed",
};

export default function StudentChat() {
    const { conversations, sendMessage } = useChatStore();
    const myConvs = conversations.filter((c) => c.participants.some((p) => p.id === ME.id));

    const [activeId, setActiveId] = useState<string>(myConvs[0]?.id ?? "");
    const [draft, setDraft] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const active = myConvs.find((c) => c.id === activeId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeId, active?.messages.length]);

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

    return (
        <div style={{ padding: 0, height: "calc(100vh - 64px)" }}>
            <div className="chat-layout">
                {/* ── Sidebar ── */}
                <div className="chat-sidebar">
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>My Messages</h2>
                        <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>
                            {myConvs.length} conversation{myConvs.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="chat-list">
                        {myConvs.map((conv) => {
                            const other = conv.participants.find((p) => p.id !== ME.id);
                            const initials = conv.type === "group" ? (conv.section ?? "GR") : (other?.initials ?? "?");
                            const lastMsg = conv.messages[conv.messages.length - 1];
                            const isActive = conv.id === activeId;

                            return (
                                <div
                                    key={conv.id}
                                    className={`chat-list-item ${isActive ? "active" : ""}`}
                                    onClick={() => setActiveId(conv.id)}
                                >
                                    <div
                                        className="avatar avatar-initials"
                                        style={{
                                            width: 40, height: 40, fontSize: "0.72rem", flexShrink: 0,
                                            background: conv.type === "group"
                                                ? "linear-gradient(135deg, #7c3aed, var(--primary-500))"
                                                : `linear-gradient(135deg, ${ROLE_COLOR[other?.role ?? "teacher"]}, ${ROLE_COLOR[other?.role ?? "teacher"]}bb)`,
                                        }}
                                    >
                                        {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {conv.type === "private" ? other?.name ?? conv.title : conv.title}
                                            </span>
                                            <span style={{ fontSize: "0.68rem", color: "var(--gray-400)", flexShrink: 0, marginLeft: 4 }}>
                                                {fmtTs(conv.lastTs)}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                            {conv.type === "group" && (
                                                <span style={{ fontSize: "0.62rem", background: "#ede9fe", color: "#7c3aed", borderRadius: "4px", padding: "1px 5px", fontWeight: 700, flexShrink: 0 }}>
                                                    GROUP
                                                </span>
                                            )}
                                            {conv.parentVisible && (
                                                <span style={{ fontSize: "0.62rem", background: "#fffbeb", color: "#92400e", borderRadius: "4px", padding: "1px 5px", fontWeight: 700, flexShrink: 0 }}>
                                                    👁 PARENT
                                                </span>
                                            )}
                                            <span style={{ fontSize: "0.78rem", color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {lastMsg?.text ?? "No messages yet"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main Panel ── */}
                {active ? (
                    <div className="chat-main">
                        {/* Header */}
                        <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {active.type === "group" ? (
                                <>
                                    <div className="avatar avatar-initials" style={{ width: 38, height: 38, fontSize: "0.72rem", background: "linear-gradient(135deg, #7c3aed, var(--primary-500))" }}>
                                        {active.section ?? "GR"}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{active.title}</div>
                                        <div style={{ fontSize: "0.74rem", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <IconUsers />
                                            {active.participants.length} members
                                        </div>
                                    </div>
                                </>
                            ) : (() => {
                                const other = active.participants.find((p) => p.id !== ME.id)!;
                                return (
                                    <>
                                        <div className="avatar avatar-initials" style={{ width: 38, height: 38, fontSize: "0.72rem", background: `linear-gradient(135deg, ${ROLE_COLOR[other.role]}, ${ROLE_COLOR[other.role]}bb)` }}>
                                            {other.initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{other.name}</div>
                                            <div style={{ fontSize: "0.74rem", color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                                                Online
                                            </div>
                                        </div>
                                        <span style={{ marginLeft: "auto", fontSize: "0.74rem", borderRadius: "20px", padding: "0.2rem 0.7rem", fontWeight: 600, textTransform: "capitalize", background: "var(--primary-50)", color: "var(--primary-600)" }}>
                                            {other.role}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Parent transparency notice */}
                        {active.parentVisible && (
                            <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "0.45rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#92400e" }}>
                                <span>👁</span>
                                <span>Your parent (Mr. Kebede) can view this conversation for transparency.</span>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="chat-messages">
                            {active.messages.map((msg) => {
                                const isMe = msg.senderId === ME.id;
                                const senderParticipant = active.participants.find((p) => p.id === msg.senderId);
                                return (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.875rem" }}>
                                        {!isMe && active.type === "group" && (
                                            <div
                                                className="avatar avatar-initials"
                                                style={{ width: 28, height: 28, fontSize: "0.6rem", flexShrink: 0, marginRight: 7, alignSelf: "flex-end", background: ROLE_COLOR[msg.senderRole] + "22", color: ROLE_COLOR[msg.senderRole] }}
                                            >
                                                {senderParticipant?.initials ?? "?"}
                                            </div>
                                        )}
                                        <div style={{ maxWidth: "68%" }}>
                                            {!isMe && active.type === "group" && (
                                                <div style={{ fontSize: "0.68rem", color: "var(--gray-500)", marginBottom: 2, paddingLeft: 2 }}>
                                                    {msg.senderName}
                                                </div>
                                            )}
                                            <div style={{
                                                padding: "0.6rem 0.875rem",
                                                borderRadius: isMe
                                                    ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)"
                                                    : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
                                                background: isMe
                                                    ? "linear-gradient(135deg, var(--success), #16a34a)"
                                                    : "var(--gray-100)",
                                                color: isMe ? "#fff" : "var(--gray-800)",
                                                fontSize: "0.875rem",
                                                lineHeight: 1.5,
                                            }}>
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                                                {fmtTime(msg.ts)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                className="chat-input"
                                placeholder="Type a message…"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                                }}
                            />
                            <button
                                className="btn btn-primary btn-icon"
                                style={{ borderRadius: "var(--radius-full)", flexShrink: 0, background: "linear-gradient(135deg, var(--success), #16a34a)", border: "none" }}
                                onClick={handleSend}
                                disabled={!draft.trim()}
                            >
                                <IconSend />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="chat-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <h3 style={{ fontWeight: 600 }}>No conversations yet</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Your teacher will appear here once a conversation is started.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
