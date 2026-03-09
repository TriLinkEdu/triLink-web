"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore, fmtTs, fmtTime, ChatParticipant, Conversation } from "@/store/chatStore";

/** Parent identity */
const ME: ChatParticipant = { id: "parent-1", name: "Mr. Kebede", role: "parent", initials: "MK" };
/** The child this parent monitors */
const CHILD_ID = "student-1";
const CHILD_NAME = "Abebe Kebede";

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

export default function ParentChat() {
    const { conversations, sendMessage } = useChatStore();

    /** Parent's own conversations */
    const myConvs = conversations.filter((c) => c.participants.some((p) => p.id === ME.id));
    /** Child's student-teacher threads visible to parent */
    const childConvs = conversations.filter(
        (c) => c.parentVisible && c.participants.some((p) => p.id === CHILD_ID)
    );

    type SidebarItem =
        | { kind: "own"; conv: Conversation }
        | { kind: "child"; conv: Conversation };

    const sidebarItems: SidebarItem[] = [
        ...myConvs.map((conv): SidebarItem => ({ kind: "own", conv })),
        ...childConvs.map((conv): SidebarItem => ({ kind: "child", conv })),
    ];

    const [activeId, setActiveId] = useState<string>(sidebarItems[0]?.conv.id ?? "");
    const [draft, setDraft] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeItem = sidebarItems.find((item) => item.conv.id === activeId);
    const active = activeItem?.conv;
    const isReadOnly = activeItem?.kind === "child";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeId, active?.messages.length]);

    function handleSend() {
        if (!draft.trim() || !activeId || isReadOnly) return;
        sendMessage(activeId, {
            senderId: ME.id,
            senderName: ME.name,
            senderRole: ME.role,
            text: draft.trim(),
        });
        setDraft("");
    }

    function getOther(conv: Conversation): ChatParticipant | undefined {
        return conv.participants.find((p) => p.id !== ME.id && p.id !== CHILD_ID);
    }

    return (
        <div style={{ height: "calc(100vh - 64px)" }}>
            <div className="chat-layout">
                {/* ── Sidebar ── */}
                <div className="chat-sidebar">
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Messages</h2>
                        <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>
                            {sidebarItems.length} conversation{sidebarItems.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="chat-list">
                        {/* Own conversations */}
                        {myConvs.length > 0 && (
                            <div style={{ padding: "0.5rem 1rem 0.25rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                My Conversations
                            </div>
                        )}
                        {myConvs.map((conv) => {
                            const other = conv.participants.find((p) => p.id !== ME.id);
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
                                        <span style={{ fontSize: "0.78rem", color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                                            {lastMsg?.text ?? "No messages yet"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Child's conversations (read-only) */}
                        {childConvs.length > 0 && (
                            <div style={{ padding: "0.75rem 1rem 0.25rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                👁 {CHILD_NAME}&apos;s Conversations
                            </div>
                        )}
                        {childConvs.map((conv) => {
                            const teacher = conv.participants.find((p) => p.role === "teacher");
                            const lastMsg = conv.messages[conv.messages.length - 1];
                            const isActive = conv.id === activeId;
                            return (
                                <div key={conv.id} className={`chat-list-item ${isActive ? "active" : ""}`} onClick={() => setActiveId(conv.id)}>
                                    <div className="avatar avatar-initials" style={{ width: 40, height: 40, fontSize: "0.72rem", flexShrink: 0, background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                                        {teacher?.initials ?? "T"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {teacher?.name ?? "Teacher"}
                                            </span>
                                            <span style={{ fontSize: "0.68rem", color: "var(--gray-400)", flexShrink: 0, marginLeft: 4 }}>{fmtTs(conv.lastTs)}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                            <span style={{ fontSize: "0.62rem", background: "#fffbeb", color: "#92400e", borderRadius: "4px", padding: "1px 5px", fontWeight: 700, flexShrink: 0 }}>READ-ONLY</span>
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
                            {(() => {
                                const displayParticipant = isReadOnly
                                    ? active.participants.find((p) => p.role === "teacher")!
                                    : active.participants.find((p) => p.id !== ME.id)!;
                                if (!displayParticipant) return null;
                                return (
                                    <>
                                        <div className="avatar avatar-initials" style={{ width: 38, height: 38, fontSize: "0.72rem", background: `linear-gradient(135deg, ${ROLE_COLOR[displayParticipant.role]}, ${ROLE_COLOR[displayParticipant.role]}bb)` }}>
                                            {displayParticipant.initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>
                                                {isReadOnly ? `${CHILD_NAME} & ${displayParticipant.name}` : displayParticipant.name}
                                            </div>
                                            <div style={{ fontSize: "0.74rem", color: isReadOnly ? "#92400e" : "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                                                {isReadOnly ? (
                                                    <><span>👁</span> Viewing {CHILD_NAME}&apos;s conversation (read-only)</>
                                                ) : (
                                                    <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />Online</>
                                                )}
                                            </div>
                                        </div>
                                        {isReadOnly && (
                                            <span style={{ marginLeft: "auto", fontSize: "0.74rem", background: "#fffbeb", color: "#92400e", borderRadius: "20px", padding: "0.2rem 0.7rem", fontWeight: 600 }}>
                                                Transparency View
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Read-only banner */}
                        {isReadOnly && (
                            <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "0.45rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#92400e" }}>
                                <span>👁</span>
                                <span>This is a read-only view of {CHILD_NAME}&apos;s private conversation with their teacher for transparency purposes.</span>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="chat-messages">
                            {active.messages.map((msg) => {
                                const isMe = msg.senderId === ME.id;
                                const isChild = msg.senderId === CHILD_ID;
                                return (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.875rem" }}>
                                        <div style={{ maxWidth: "68%" }}>
                                            {isReadOnly && (
                                                <div style={{ fontSize: "0.68rem", marginBottom: 2, paddingLeft: 2, color: isChild ? "var(--success)" : "var(--primary-500)", fontWeight: 600 }}>
                                                    {msg.senderName}
                                                </div>
                                            )}
                                            <div style={{
                                                padding: "0.6rem 0.875rem",
                                                borderRadius: isMe
                                                    ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)"
                                                    : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
                                                background: isMe
                                                    ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                                                    : isReadOnly
                                                        ? isChild ? "#dcfce7" : "var(--gray-100)"
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

                        {/* Input (disabled for read-only) */}
                        <div className="chat-input-area" style={{ opacity: isReadOnly ? 0.5 : 1 }}>
                            <input
                                className="chat-input"
                                placeholder={isReadOnly ? "Read-only — you cannot reply to this conversation" : "Type a message…"}
                                disabled={isReadOnly}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            />
                            <button
                                className="btn btn-primary btn-icon"
                                style={{ borderRadius: "var(--radius-full)", flexShrink: 0, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none" }}
                                onClick={handleSend}
                                disabled={!draft.trim() || isReadOnly}
                            >
                                <IconSend />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="chat-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <h3 style={{ fontWeight: 600 }}>Select a conversation</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Choose a message from the sidebar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
