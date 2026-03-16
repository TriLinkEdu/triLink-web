"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
    useChatStore, fmtTs, fmtTime,
    Conversation, ChatParticipant, SECTION_STUDENTS,
} from "@/store/chatStore";

const ME: ChatParticipant = { id: "teacher-1", name: "Mr. Solomon", role: "teacher", initials: "MS" };

type Filter = "all" | "private" | "group";

const ROLE_COLOR: Record<string, string> = {
    student: "#10b981",
    admin: "#f59e0b",
    parent: "#7c3aed",
    teacher: "#3b82f6",
};
const ROLE_BG: Record<string, string> = {
    student: "#dcfce7",
    admin: "#fef3c7",
    parent: "#ede9fe",
    teacher: "#eff6ff",
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

interface QuickProfile {
    name: string;
    roleLabel: string;
    summary: string;
    email: string;
    phone: string;
    meta: string[];
}

const PARTICIPANT_DIRECTORY: Record<string, Omit<QuickProfile, "name">> = {
    "student-1": {
        roleLabel: "Student",
        summary: "Consistent mathematics learner who actively asks questions and follows up on feedback.",
        email: "abebe.kebede@student.trilink.edu",
        phone: "+251 911 345 678",
        meta: ["Grade 11-A", "Calculus focus", "Parent-visible chat"],
    },
    "student-2": {
        roleLabel: "Student",
        summary: "Strong class participation with a clear interest in mechanics and applied math.",
        email: "sara.haile@student.trilink.edu",
        phone: "+251 911 456 789",
        meta: ["Grade 11-A", "Quiz regular", "Science track"],
    },
    "student-3": {
        roleLabel: "Student",
        summary: "Responsive in group discussions and usually among the first to complete assignments.",
        email: "dawit.tadesse@student.trilink.edu",
        phone: "+251 911 567 890",
        meta: ["Grade 11-A", "Assignment complete", "Discussion active"],
    },
    "student-4": {
        roleLabel: "Student",
        summary: "Quiet but steady learner with improving performance across recent tasks.",
        email: "meron.alemu@student.trilink.edu",
        phone: "+251 911 678 901",
        meta: ["Grade 11-A", "Needs confidence", "Attendance stable"],
    },
    "student-5": {
        roleLabel: "Student",
        summary: "Shows reliable attendance and works well in structured class activities.",
        email: "yonas.bekele@student.trilink.edu",
        phone: "+251 911 789 012",
        meta: ["Grade 11-A", "Homework on time", "Section member"],
    },
    "student-6": {
        roleLabel: "Student",
        summary: "Performs well in short quizzes and engages effectively during revision sessions.",
        email: "tigist.girma@student.trilink.edu",
        phone: "+251 912 100 111",
        meta: ["Grade 11-B", "Quiz strong", "Revision active"],
    },
    "student-7": {
        roleLabel: "Student",
        summary: "Consistent performer with strong interest in problem-solving exercises.",
        email: "biruk.tesfaye@student.trilink.edu",
        phone: "+251 912 100 222",
        meta: ["Grade 11-B", "Problem solver", "Class regular"],
    },
    "student-8": {
        roleLabel: "Student",
        summary: "Works carefully and benefits from clear step-by-step explanations.",
        email: "helen.assefa@student.trilink.edu",
        phone: "+251 912 100 333",
        meta: ["Grade 11-B", "Careful pace", "Needs worked examples"],
    },
    "student-9": {
        roleLabel: "Student",
        summary: "Active in lessons and often helps keep group tasks moving forward.",
        email: "samuel.getachew@student.trilink.edu",
        phone: "+251 912 100 444",
        meta: ["Grade 11-B", "Group active", "Peer support"],
    },
    "student-10": {
        roleLabel: "Student",
        summary: "Senior student focused on exam preparation and final-year performance.",
        email: "mulugeta.worku@student.trilink.edu",
        phone: "+251 913 200 111",
        meta: ["Grade 12-A", "Exam focus", "Senior batch"],
    },
    "student-11": {
        roleLabel: "Student",
        summary: "Balanced academic profile with dependable participation in class review sessions.",
        email: "selam.habtamu@student.trilink.edu",
        phone: "+251 913 200 222",
        meta: ["Grade 12-A", "Review regular", "Balanced profile"],
    },
    "student-12": {
        roleLabel: "Student",
        summary: "Confident in discussions and tends to finish timed activities quickly.",
        email: "robel.kifle@student.trilink.edu",
        phone: "+251 913 200 333",
        meta: ["Grade 12-A", "Fast finisher", "Confident speaker"],
    },
    "student-13": {
        roleLabel: "Student",
        summary: "Shows interest in structured tutoring and keeps improving across assessments.",
        email: "hana.tesfaye@student.trilink.edu",
        phone: "+251 914 300 111",
        meta: ["Grade 12-B", "Tutoring responsive", "Assessment improving"],
    },
    "student-14": {
        roleLabel: "Student",
        summary: "Participates more in smaller groups and responds well to direct feedback.",
        email: "naod.girma@student.trilink.edu",
        phone: "+251 914 300 222",
        meta: ["Grade 12-B", "Direct feedback", "Small-group active"],
    },
    "student-15": {
        roleLabel: "Student",
        summary: "Reliable attendance with steady effort during revision and quiz preparation.",
        email: "lidiya.bekele@student.trilink.edu",
        phone: "+251 914 300 333",
        meta: ["Grade 12-B", "Reliable attendance", "Quiz prep regular"],
    },
    "admin-1": {
        roleLabel: "Administration",
        summary: "Academic office contact for schedules, deadlines, and staff coordination updates.",
        email: "admin.office@trilink.edu",
        phone: "+251 911 000 000",
        meta: ["Admin Office", "Staff coordination", "School notices"],
    },
    "parent-1": {
        roleLabel: "Parent",
        summary: "Parent contact for student follow-up, progress transparency, and support coordination.",
        email: "kebede.family@parent.trilink.edu",
        phone: "+251 911 345 679",
        meta: ["Parent account", "Abebe Kebede", "Transparency enabled"],
    },
    "teacher-1": {
        roleLabel: "Teacher",
        summary: "Mathematics teacher responsible for Grade 11 and Grade 12 instruction and assessment follow-up.",
        email: "solomon@school.edu",
        phone: "+251 912 345 678",
        meta: ["Mathematics", "Homeroom Grade 11-A", "Room 301"],
    },
};

function findSectionForStudent(participantId: string): string | null {
    for (const [section, students] of Object.entries(SECTION_STUDENTS)) {
        if (students.some((student) => student.id === participantId)) return `Grade ${section}`;
    }
    return null;
}

function getQuickProfile(participant: ChatParticipant, conversation?: Conversation): QuickProfile {
    const known = PARTICIPANT_DIRECTORY[participant.id];
    if (known) {
        return { name: participant.name, ...known };
    }

    if (participant.role === "student") {
        const section = conversation?.section ? `Grade ${conversation.section}` : findSectionForStudent(participant.id) ?? "Student group";
        return {
            name: participant.name,
            roleLabel: "Student",
            summary: "Student account available for class communication, assignment follow-up, and learning support.",
            email: `${participant.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@student.trilink.edu`,
            phone: "+251 900 000 000",
            meta: [section, "Academic chat enabled", "Teacher contact"],
        };
    }

    return {
        name: participant.name,
        roleLabel: participant.role.charAt(0).toUpperCase() + participant.role.slice(1),
        summary: `${participant.role.charAt(0).toUpperCase() + participant.role.slice(1)} account available for school communication and updates.`,
        email: `${participant.role}@trilink.edu`,
        phone: "+251 900 000 000",
        meta: [participant.role, "Portal user"],
    };
}

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
    onOpenProfile,
}: {
    conversation: Conversation;
    endRef: React.RefObject<HTMLDivElement | null>;
    onOpenProfile: (participant: ChatParticipant, conversation: Conversation) => void;
}) {
    return (
        <div className="chat-messages" style={{ background: "radial-gradient(circle at top left, rgba(14,165,233,0.08), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)" }}>
            {conversation.messages.map((msg) => {
                const isMe = msg.senderId === ME.id;
                const senderParticipant = conversation.participants.find((p) => p.id === msg.senderId);
                return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.25rem" }}>
                        {!isMe && conversation.type === "group" && senderParticipant && (
                            <button
                                onClick={() => onOpenProfile(senderParticipant, conversation)}
                                style={{ width: 28, height: 28, padding: 0, border: "none", background: "transparent", cursor: "pointer", marginRight: 8, alignSelf: "flex-end", flexShrink: 0 }}
                                aria-label={`Open profile for ${senderParticipant.name}`}
                            >
                                <div
                                    className="avatar avatar-initials"
                                    style={{ width: 28, height: 28, fontSize: "0.6rem", background: ROLE_COLOR[msg.senderRole] + "22", color: ROLE_COLOR[msg.senderRole] }}
                                >
                                    {senderParticipant.initials}
                                </div>
                            </button>
                        )}
                        <div style={{ maxWidth: "72%" }}>
                            {!isMe && conversation.type === "group" && senderParticipant && (
                                <button
                                    onClick={() => onOpenProfile(senderParticipant, conversation)}
                                    style={{ fontSize: "0.68rem", color: "var(--gray-500)", marginBottom: 4, paddingLeft: 2, border: "none", background: "transparent", cursor: "pointer" }}
                                >
                                    {msg.senderName}
                                </button>
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
    const [selectedProfile, setSelectedProfile] = useState<{ participant: ChatParticipant; conversation: Conversation } | null>(null);

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

    function openParticipantProfile(participant: ChatParticipant, conversation: Conversation) {
        setSelectedProfile({ participant, conversation });
    }

    const activePrivateParticipant = active?.type === "private"
        ? active.participants.find((participant) => participant.id !== ME.id) ?? null
        : null;
    const selectedProfileData = selectedProfile
        ? getQuickProfile(selectedProfile.participant, selectedProfile.conversation)
        : null;

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
                                const other = activePrivateParticipant!;
                                return (
                                    <>
                                        <button
                                            onClick={() => openParticipantProfile(other, active)}
                                            style={{ display: "flex", alignItems: "center", gap: "0.75rem", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                                            aria-label={`Open profile for ${other.name}`}
                                        >
                                            <div
                                                className="avatar avatar-initials"
                                                style={{ width: 38, height: 38, fontSize: "0.72rem", background: `linear-gradient(135deg, ${ROLE_COLOR[other.role]}, ${ROLE_COLOR[other.role]}bb)` }}
                                            >
                                                {other.initials}
                                            </div>
                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{other.name}</div>
                                                <div style={{ fontSize: "0.74rem", color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                                                    View profile
                                                </div>
                                            </div>
                                        </button>
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
                        <MessageList conversation={active} endRef={messagesEndRef} onOpenProfile={openParticipantProfile} />

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
