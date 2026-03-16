"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
    useChatStore, fmtTs, fmtTime,
    Conversation, ChatParticipant, SECTION_STUDENTS,
} from "@/store/chatStore";

const ME: ChatParticipant = { id: "teacher-1", name: "Mr. Solomon", role: "teacher", initials: "MS" };

type Filter = "all" | "private" | "group";

const ROLE_COLOR: Record<string, string> = {
    student: "var(--success)",
    admin: "var(--warning)",
    parent: "#7c3aed",
    teacher: "var(--primary-500)",
};
const ROLE_BG: Record<string, string> = {
    student: "#dcfce7",
    admin: "var(--warning-light)",
    parent: "#ede9fe",
    teacher: "var(--primary-50)",
};

const IconSend = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
    </svg>
);
const IconUsers = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconSpark = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
    </svg>
);

const ConversationList = memo(function ConversationList({
    conversations,
    activeId,
    onSelect,
}: {
    conversations: Conversation[];
    activeId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="chat-list">
            {conversations.length === 0 && (
                <div style={{ padding: "2rem 1.25rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.8rem" }}>
                    No conversations
                </div>
            )}
            {conversations.map((conv) => {
                const other = conv.type === "private" ? conv.participants.find((p) => p.id !== ME.id) : null;
                const initials = conv.type === "group" ? (conv.section ?? "GR") : (other?.initials ?? "?");
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isActive = conv.id === activeId;

                return (
                    <div
                        key={conv.id}
                        className={`chat-list-item ${isActive ? "active" : ""}`}
                        onClick={() => onSelect(conv.id)}
                        style={{ borderRadius: 16, margin: "0.35rem 0.55rem", border: isActive ? "1px solid rgba(37,99,235,0.18)" : "1px solid transparent" }}
                    >
                        <div
                            className="avatar avatar-initials"
                            style={{
                                width: 42, height: 42, fontSize: "0.72rem", flexShrink: 0,
                                background: conv.type === "group"
                                    ? "linear-gradient(135deg, #0f766e, #14b8a6)"
                                    : `linear-gradient(135deg, ${ROLE_COLOR[other?.role ?? "teacher"]}, ${ROLE_COLOR[other?.role ?? "teacher"]}bb)`,
                                boxShadow: isActive ? "0 10px 24px rgba(15, 23, 42, 0.12)" : "none",
                            }}
                        >
                            {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--gray-900)" }}>
                                    {conv.title}
                                </span>
                                <span style={{ fontSize: "0.68rem", color: "var(--gray-400)", flexShrink: 0 }}>
                                    {fmtTs(conv.lastTs)}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                {conv.type === "group" && (
                                    <span style={{ fontSize: "0.62rem", background: "#ccfbf1", color: "#0f766e", borderRadius: "999px", padding: "2px 7px", fontWeight: 700, flexShrink: 0 }}>
                                        GROUP
                                    </span>
                                )}
                                {conv.parentVisible && (
                                    <span style={{ fontSize: "0.62rem", background: "var(--warning-light)", color: "#92400e", borderRadius: "999px", padding: "2px 7px", fontWeight: 700, flexShrink: 0 }}>
                                        PARENT
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
    );
});

const MessageList = memo(function MessageList({
    conversation,
    endRef,
}: {
    conversation: Conversation;
    endRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div className="chat-messages" style={{ background: "radial-gradient(circle at top left, rgba(14,165,233,0.08), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)" }}>
            {conversation.messages.map((msg) => {
                const isMe = msg.senderId === ME.id;
                const senderParticipant = conversation.participants.find((p) => p.id === msg.senderId);
                return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.25rem" }}>
                        {!isMe && conversation.type === "group" && (
                            <div
                                className="avatar avatar-initials"
                                style={{ width: 28, height: 28, fontSize: "0.6rem", flexShrink: 0, marginRight: 8, alignSelf: "flex-end", background: ROLE_COLOR[msg.senderRole] + "22", color: ROLE_COLOR[msg.senderRole] }}
                            >
                                {senderParticipant?.initials ?? "?"}
                            </div>
                        )}
                        <div style={{ maxWidth: "72%" }}>
                            {!isMe && conversation.type === "group" && (
                                <div style={{ fontSize: "0.68rem", color: "var(--gray-500)", marginBottom: 4, paddingLeft: 2 }}>
                                    {msg.senderName}
                                </div>
                            )}
                            <div style={{
                                padding: "0.7rem 0.9rem",
                                borderRadius: isMe
                                    ? "18px 18px 6px 18px"
                                    : "18px 18px 18px 6px",
                                    background: isMe
                                        ? "#2563eb"
                                    : "#ffffff",
                                color: isMe ? "#fff" : "var(--gray-800)",
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                border: isMe ? "none" : "1px solid rgba(148,163,184,0.18)",
                                boxShadow: isMe ? "0 12px 28px rgba(37, 99, 235, 0.2)" : "0 10px 24px rgba(15, 23, 42, 0.06)",
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", marginTop: 4, textAlign: isMe ? "right" : "left" }}>
                                {fmtTime(msg.ts)}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={endRef} />
        </div>
    );
});

export default function TeacherChat() {
    const { conversations, sendMessage, createGroup, markConversationRead } = useChatStore();
    const myConvs = useMemo(
        () => conversations.filter((c) => c.participants.some((p) => p.id === ME.id)),
        [conversations]
    );

    const [filter, setFilter] = useState<Filter>("all");
    const [activeId, setActiveId] = useState<string>(myConvs[0]?.id ?? "");
    const [draft, setDraft] = useState("");
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [groupSection, setGroupSection] = useState("11-A");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(
        () => myConvs.filter((c) => filter === "all" || c.type === filter),
        [filter, myConvs]
    );
    const active = useMemo(
        () => myConvs.find((c) => c.id === activeId),
        [activeId, myConvs]
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: active?.messages.length ? "auto" : "smooth" });
    }, [activeId, active?.messages.length]);

    useEffect(() => {
        if (activeId) {
            markConversationRead(activeId);
        }
    }, [activeId, markConversationRead]);

    useEffect(() => {
        if (filtered.length === 0) {
            if (activeId) setActiveId("");
            return;
        }

        if (!activeId || !filtered.some((conv) => conv.id === activeId)) {
            setActiveId(filtered[0].id);
        }
    }, [activeId, filtered]);

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

    function handleCreateGroup() {
        const students = SECTION_STUDENTS[groupSection].filter((s) =>
            selectedStudents.includes(s.id)
        );
        if (students.length === 0) return;
        createGroup(groupSection, [ME, ...students]);
        setShowNewGroup(false);
        setSelectedStudents([]);
    }

    return (
        <div className="page-wrapper" style={{ padding: 0, height: "calc(100vh - 64px)", background: "linear-gradient(180deg, #f8fbff 0%, #eef7f8 100%)" }}>
            <div className="chat-layout">
                {/* ── Sidebar ── */}
                <div className="chat-sidebar" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,252,0.96) 100%)", backdropFilter: "blur(10px)" }}>
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Messages</h2>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "0.72rem", color: "var(--gray-500)" }}>
                                    <IconSpark />
                                    {filtered.length > 0 ? `${filtered.length} active conversation${filtered.length === 1 ? "" : "s"}` : "No active conversations"}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem" }}
                                onClick={() => setShowNewGroup(true)}
                            >
                                + New Group
                            </button>
                        </div>
                        {/* Filter tabs */}
                        <div style={{ display: "flex", gap: "0.35rem", padding: "0.2rem", borderRadius: 999, background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}>
                            {(["all", "private", "group"] as Filter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        flex: 1,
                                        padding: "0.42rem 0.1rem",
                                        fontSize: "0.72rem",
                                        fontWeight: filter === f ? 700 : 600,
                                        borderRadius: 999,
                                        border: "1px solid transparent",
                                        cursor: "pointer",
                                        background: filter === f ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
                                        color: filter === f ? "#fff" : "var(--gray-600)",
                                        boxShadow: filter === f ? "0 8px 18px rgba(37, 99, 235, 0.22)" : "none",
                                        textTransform: "capitalize",
                                        transition: "all var(--transition-fast)",
                                    }}
                                >
                                    {f === "all"
                                        ? (myConvs.length > 0 ? `All (${myConvs.length})` : "All")
                                        : f === "private"
                                        ? "Private"
                                        : "Groups"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ConversationList conversations={filtered} activeId={activeId} onSelect={setActiveId} />
                </div>

                {/* ── Main Panel ── */}
                {active ? (
                    <div className="chat-main" style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)" }}>
                        {/* Header */}
                        <div style={{ padding: "0.95rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.84)" }}>
                            {active.type === "group" ? (
                                <>
                                    <div
                                        className="avatar avatar-initials"
                                        style={{ width: 38, height: 38, fontSize: "0.72rem", background: "linear-gradient(135deg, #7c3aed, var(--primary-500))" }}
                                    >
                                        {active.section ?? "GR"}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{active.title}</div>
                                        <div style={{ fontSize: "0.74rem", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <IconUsers />
                                            {active.participants.length} members &middot; {active.participants.filter((p) => p.role === "student").length} students
                                        </div>
                                    </div>
                                    <span style={{ marginLeft: "auto", fontSize: "0.74rem", background: "#ede9fe", color: "#7c3aed", borderRadius: "20px", padding: "0.2rem 0.7rem", fontWeight: 600 }}>
                                        Section {active.section}
                                    </span>
                                </>
                            ) : (() => {
                                const other = active.participants.find((p) => p.id !== ME.id)!;
                                return (
                                    <>
                                        <div
                                            className="avatar avatar-initials"
                                            style={{ width: 38, height: 38, fontSize: "0.72rem", background: `linear-gradient(135deg, ${ROLE_COLOR[other.role]}, ${ROLE_COLOR[other.role]}bb)` }}
                                        >
                                            {other.initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{other.name}</div>
                                            <div style={{ fontSize: "0.74rem", color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                                                Online
                                            </div>
                                        </div>
                                        <span style={{ marginLeft: "auto", fontSize: "0.74rem", borderRadius: "20px", padding: "0.2rem 0.7rem", fontWeight: 600, textTransform: "capitalize", background: ROLE_BG[other.role], color: ROLE_COLOR[other.role] }}>
                                            {other.role}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Parent transparency banner */}
                        {active.parentVisible && (
                            <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "0.45rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#92400e" }}>
                                <span>👁</span>
                                <span><strong>Parent transparency:</strong> Mr. Kebede (Abebe&apos;s parent) can view this conversation.</span>
                            </div>
                        )}

                        {/* Messages */}
                        <MessageList conversation={active} endRef={messagesEndRef} />

                        {/* Input area */}
                        <div className="chat-input-area" style={{ background: "rgba(255,255,255,0.9)" }}>
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
                                style={{ borderRadius: "var(--radius-full)", flexShrink: 0 }}
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
                            <h3 style={{ fontWeight: 600 }}>Select a conversation</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Choose a message from the sidebar to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── New Group Modal ── */}
            {showNewGroup && (
                <div className="modal-overlay" onClick={() => setShowNewGroup(false)}>
                    <div className="modal" style={{ maxWidth: 480, width: "90%" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontWeight: 700 }}>Create Class Group</h3>
                            <button className="btn-icon" onClick={() => setShowNewGroup(false)}><IconClose /></button>
                        </div>
                        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Select Section</label>
                                <select
                                    className="form-select"
                                    value={groupSection}
                                    onChange={(e) => { setGroupSection(e.target.value); setSelectedStudents([]); }}
                                >
                                    {Object.keys(SECTION_STUDENTS).map((s) => (
                                        <option key={s} value={s}>Grade {s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Students <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>({selectedStudents.length} selected)</span></span>
                                    <button
                                        style={{ fontSize: "0.75rem", color: "var(--primary-600)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                                        onClick={() => setSelectedStudents(SECTION_STUDENTS[groupSection].map((s) => s.id))}
                                    >
                                        Select All
                                    </button>
                                </label>
                                <div style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                                    {SECTION_STUDENTS[groupSection].map((student, idx) => (
                                        <label
                                            key={student.id}
                                            style={{
                                                display: "flex", alignItems: "center", gap: "0.75rem",
                                                padding: "0.6rem 1rem", cursor: "pointer",
                                                borderBottom: idx < SECTION_STUDENTS[groupSection].length - 1 ? "1px solid var(--gray-100)" : "none",
                                                background: selectedStudents.includes(student.id) ? "var(--primary-50)" : "",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedStudents((p) => [...p, student.id]);
                                                    else setSelectedStudents((p) => p.filter((id) => id !== student.id));
                                                }}
                                            />
                                            <div className="avatar avatar-initials" style={{ width: 28, height: 28, fontSize: "0.65rem", flexShrink: 0 }}>
                                                {student.initials}
                                            </div>
                                            <span style={{ fontSize: "0.875rem" }}>{student.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowNewGroup(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateGroup}
                                disabled={selectedStudents.length === 0}
                            >
                                Create Group ({selectedStudents.length} students)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
