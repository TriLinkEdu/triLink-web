"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore, fmtTs, fmtTime, ChatParticipant, Conversation } from "@/store/chatStore";

const ME: ChatParticipant = { id: "admin-1", name: "Admin Office", role: "admin", initials: "AO" };

const IconSend = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const ROLE_COLOR: Record<string, string> = {
    teacher: "var(--primary-500)",
    student: "var(--success)",
    admin: "var(--warning)",
    parent: "#7c3aed",
};

const STAFF: ChatParticipant[] = [
    { id: "teacher-1", name: "Mr. Solomon", role: "teacher", initials: "MS" },
    { id: "teacher-2", name: "Ms. Tigist", role: "teacher", initials: "MT" },
    { id: "teacher-3", name: "Mr. Habtamu", role: "teacher", initials: "MH" },
];

export default function AdminChat() {
    const { conversations, sendMessage } = useChatStore();
    const myConvs = conversations.filter((c) => c.participants.some((p) => p.id === ME.id));

    const [activeId, setActiveId] = useState<string>(myConvs[0]?.id ?? "");
    const [draft, setDraft] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const active = myConvs.find((c) => c.id === activeId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeId, active?.messages.length]);

    function handleSend() {
        if (!draft.trim() || !activeId) return;
        sendMessage(activeId, { senderId: ME.id, senderName: ME.name, senderRole: ME.role, text: draft.trim() });
        setDraft("");
    }

    function getOther(conv: Conversation): ChatParticipant | undefined {
        return conv.participants.find((p) => p.id !== ME.id);
    }

    return (
        <div className="page-wrapper" style={{ padding: 0, height: "calc(100vh - 64px)" }}>
            <div className="chat-layout">
                {/* ── Sidebar ── */}
                <div className="chat-sidebar">
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Admin Messages</h2>
                            <button className="btn btn-primary" style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem" }} onClick={() => setShowNewChat(true)}>
                                + New Chat
                            </button>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: "0.4rem" }}>
                            {myConvs.length} conversation{myConvs.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="chat-list">
                        {myConvs.length === 0 && (
                            <div style={{ padding: "2rem 1.25rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.8rem" }}>No conversations yet</div>
                        )}
                        {myConvs.map((conv) => {
                            const other = getOther(conv);
                            const lastMsg = conv.messages[conv.messages.length - 1];
                            const isActive = conv.id === activeId;
                            return (
                                <div key={conv.id} className={`chat-list-item ${isActive ? "active" : ""}`} onClick={() => setActiveId(conv.id)}>
                                    <div className="avatar avatar-initials" style={{ width: 40, height: 40, fontSize: "0.72rem", flexShrink: 0, background: `linear-gradient(135deg, ${ROLE_COLOR[other?.role ?? "teacher"]}, ${ROLE_COLOR[other?.role ?? "teacher"]}bb)` }}>
                                        {other?.initials ?? "?"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other?.name ?? conv.title}</span>
                                            <span style={{ fontSize: "0.68rem", color: "var(--gray-400)", flexShrink: 0, marginLeft: 4 }}>{fmtTs(conv.lastTs)}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                            <span style={{ fontSize: "0.62rem", fontWeight: 600, borderRadius: "4px", padding: "1px 5px", flexShrink: 0, textTransform: "capitalize", background: ROLE_COLOR[other?.role ?? "teacher"] + "22", color: ROLE_COLOR[other?.role ?? "teacher"] }}>
                                                {other?.role ?? "user"}
                                            </span>
                                            <span style={{ fontSize: "0.78rem", color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastMsg?.text ?? "No messages yet"}</span>
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
                        <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {(() => {
                                const other = active.participants.find((p) => p.id !== ME.id)!;
                                return (
                                    <>
                                        <div className="avatar avatar-initials" style={{ width: 38, height: 38, fontSize: "0.72rem", background: `linear-gradient(135deg, ${ROLE_COLOR[other.role]}, ${ROLE_COLOR[other.role]}bb)` }}>
                                            {other.initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{other.name}</div>
                                            <div style={{ fontSize: "0.74rem", color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />Online
                                            </div>
                                        </div>
                                        <span style={{ marginLeft: "auto", fontSize: "0.74rem", borderRadius: "20px", padding: "0.2rem 0.7rem", fontWeight: 600, textTransform: "capitalize", background: ROLE_COLOR[other.role] + "22", color: ROLE_COLOR[other.role] }}>
                                            {other.role}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="chat-messages">
                            {active.messages.map((msg) => {
                                const isMe = msg.senderId === ME.id;
                                return (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.875rem" }}>
                                        <div style={{ maxWidth: "68%" }}>
                                            <div style={{ padding: "0.6rem 0.875rem", borderRadius: isMe ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)" : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px", background: isMe ? "linear-gradient(135deg, var(--warning), #d97706)" : "var(--gray-100)", color: isMe ? "#fff" : "var(--gray-800)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{fmtTime(msg.ts)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <input className="chat-input" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                            <button className="btn btn-primary btn-icon" style={{ borderRadius: "var(--radius-full)", flexShrink: 0, background: "linear-gradient(135deg, var(--warning), #d97706)", border: "none" }} onClick={handleSend} disabled={!draft.trim()}>
                                <IconSend />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="chat-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <h3 style={{ fontWeight: 600 }}>Select a conversation</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Choose a message from the sidebar to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── New Chat Modal ── */}
            {showNewChat && (
                <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
                    <div className="modal" style={{ maxWidth: 400, width: "90%" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontWeight: 700 }}>Start New Conversation</h3>
                            <button className="btn-icon" onClick={() => setShowNewChat(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.75rem" }}>Select a staff member to message:</p>
                            {STAFF.map((person) => {
                                const exists = myConvs.some((c) => c.participants.some((p) => p.id === person.id));
                                return (
                                    <div key={person.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "var(--radius)", cursor: exists ? "default" : "pointer", background: exists ? "var(--gray-50)" : "", border: "1px solid var(--gray-200)", marginBottom: "0.5rem", opacity: exists ? 0.6 : 1 }}
                                        onClick={() => {
                                            if (exists) return;
                                            const convId = `conv-admin-${person.id}`;
                                            sendMessage(convId, { senderId: ME.id, senderName: ME.name, senderRole: ME.role, text: "Hello, I wanted to reach out." });
                                            setShowNewChat(false);
                                        }}
                                    >
                                        <div className="avatar avatar-initials" style={{ width: 36, height: 36, fontSize: "0.72rem", background: `linear-gradient(135deg, ${ROLE_COLOR[person.role]}, ${ROLE_COLOR[person.role]}bb)` }}>{person.initials}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{person.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", textTransform: "capitalize" }}>{person.role}</div>
                                        </div>
                                        {exists && <span style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>Already chatting</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowNewChat(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
