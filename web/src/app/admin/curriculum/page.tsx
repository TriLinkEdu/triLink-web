"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * Admin · Curriculum — subjects + topics tree wired to the real backend.
 * Uses `listSubjects`, `createSubject`, `patchSubject`, `deleteSubject` for
 * subjects, and `listTopicsBySubject`, `createTopic`, `updateTopic`,
 * `deleteTopic` for the per-subject topic tree.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon, PageHead, Pill, StatGrid, StatTile } from "@/components/kit";
import {
    KField,
    KitInput,
    KitTextarea,
    KitDialog,
    KitErrorBanner,
    KitEmpty,
    KitLoadingBlock,
    KitToast,
    KitSpinner,
} from "@/components/kit/local";
import {
    listSubjects,
    createSubject,
    patchSubject,
    deleteSubject,
    listTopicsBySubject,
    createTopic,
    updateTopic,
    deleteTopic,
    type Subject,
    type TopicRecord,
} from "@/lib/admin-api";
import { useConfirm } from "@/hooks/useConfirm";

type ToastState = { msg: string; tone?: "success" | "danger" | "warning" } | null;

function topicLabel(t: TopicRecord): string {
    return t.title ?? t.name ?? "Untitled topic";
}

export default function AdminCurriculumPage() {
    const { confirm, element: confirmEl } = useConfirm();
    const [subjects, setSubjects] = useState<Subject[] | null>(null);
    const [topicsBySubject, setTopicsBySubject] = useState<Record<string, TopicRecord[]>>({});
    const [loadingTopicsFor, setLoadingTopicsFor] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [err, setErr] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);

    const [newSubjectOpen, setNewSubjectOpen] = useState(false);
    const [editSubject, setEditSubject] = useState<Subject | null>(null);
    const [newTopicSubjectId, setNewTopicSubjectId] = useState<string | null>(null);
    const [editTopic, setEditTopic] = useState<{ subjectId: string; topic: TopicRecord } | null>(null);

    const showToast = useCallback((msg: string, tone: ToastState extends infer T ? (T extends null ? never : "success" | "danger" | "warning") : never = "success" as never) => {
        setToast({ msg, tone });
        window.setTimeout(() => setToast(null), 2400);
    }, []);

    const loadSubjects = useCallback(async () => {
        try {
            const list = await listSubjects();
            setSubjects(list);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load subjects");
        }
    }, []);

    useEffect(() => {
        void loadSubjects();
    }, [loadSubjects]);

    const loadTopics = useCallback(
        async (subjectId: string) => {
            setLoadingTopicsFor((s) => {
                const next = new Set(s);
                next.add(subjectId);
                return next;
            });
            try {
                const t = await listTopicsBySubject(subjectId);
                setTopicsBySubject((m) => ({ ...m, [subjectId]: t }));
            } catch (e) {
                showToast(e instanceof Error ? e.message : "Failed to load topics", "danger" as never);
            } finally {
                setLoadingTopicsFor((s) => {
                    const next = new Set(s);
                    next.delete(subjectId);
                    return next;
                });
            }
        },
        [showToast],
    );

    const toggleSubject = useCallback(
        (id: string) => {
            setExpanded((e) => ({ ...e, [id]: !e[id] }));
            if (!topicsBySubject[id]) void loadTopics(id);
        },
        [topicsBySubject, loadTopics],
    );

    const stats = useMemo(() => {
        const subjCount = subjects?.length ?? 0;
        let topicsCount = 0;
        for (const arr of Object.values(topicsBySubject)) topicsCount += arr.length;
        return {
            subjects: subjCount,
            topics: topicsCount,
            loaded: Object.keys(topicsBySubject).length,
            uncharted: Math.max(0, subjCount - Object.keys(topicsBySubject).length),
        };
    }, [subjects, topicsBySubject]);

    if (err) {
        return (
            <div className="kit-page" data-role="admin">
                <KitErrorBanner message={err} />
            </div>
        );
    }

    return (
        <div className="kit-page" data-role="admin">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Institution · Curriculum
                        <span className="dot-sep">·</span>
                        {stats.subjects} subject{stats.subjects === 1 ? "" : "s"} ·{" "}
                        {stats.topics} topic{stats.topics === 1 ? "" : "s"}
                    </>
                }
                title={
                    <>
                        Curriculum
                        <span
                            style={{
                                fontFamily: "var(--font-serif)",
                                fontStyle: "italic",
                                color: "var(--brand)",
                            }}
                        >
                            .
                        </span>
                    </>
                }
                sub="Maintain subjects and the topic tree under each subject."
                actions={
                    <button
                        type="button"
                        className="btn-kit btn-kit-primary"
                        onClick={() => setNewSubjectOpen(true)}
                    >
                        <Icon name="plus" /> New subject
                    </button>
                }
            />

            <StatGrid cols={4} className="!mb-[14px]">
                <StatTile
                    icon="book"
                    label="Subjects"
                    value={String(stats.subjects)}
                    note="in the catalog"
                />
                <StatTile
                    icon="layers"
                    label="Topics"
                    value={String(stats.topics)}
                    note={stats.loaded ? `across ${stats.loaded} loaded` : "expand to load"}
                />
                <StatTile
                    icon="check"
                    label="Loaded"
                    value={String(stats.loaded)}
                    note="subjects expanded"
                />
                <StatTile
                    icon="alertTri"
                    label="Unloaded"
                    value={String(stats.uncharted)}
                    note="click to expand"
                />
            </StatGrid>

            <div className="k-card">
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">Topic tree</div>
                        <div className="k-card__sub">Click a subject to expand its topics</div>
                    </div>
                </div>

                {subjects == null ? (
                    <KitLoadingBlock label="Loading subjects…" />
                ) : subjects.length === 0 ? (
                    <KitEmpty
                        icon={<Icon name="book" size={20} />}
                        title="No subjects yet"
                        sub="Add your first subject to start building the curriculum tree."
                    />
                ) : (
                    <div>
                        {subjects.map((s) => {
                            const isOpen = !!expanded[s.id];
                            const isLoading = loadingTopicsFor.has(s.id);
                            const topics = topicsBySubject[s.id] ?? [];
                            return (
                                <div key={s.id}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggleSubject(s.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggleSubject(s.id);
                                            }
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "10px 14px",
                                            borderBottom: "1px solid var(--color-hairline)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Icon
                                            name="chev"
                                            size={11}
                                            className={isOpen ? "rotate-90" : ""}
                                        />
                                        <Icon name="book" size={14} />
                                        <span
                                            style={{
                                                fontSize: 13.5,
                                                fontWeight: 500,
                                                color: "var(--ink)",
                                                flex: 1,
                                            }}
                                        >
                                            {s.name}
                                        </span>
                                        {s.code ? <Pill kind="neutral">{s.code}</Pill> : null}
                                        <span
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: 11,
                                                color: "var(--ink-3)",
                                            }}
                                        >
                                            {topics.length} {topics.length === 1 ? "topic" : "topics"}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-kit btn-kit-ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setNewTopicSubjectId(s.id);
                                            }}
                                            title="Add topic"
                                            aria-label="Add topic"
                                        >
                                            <Icon name="plus" size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-kit btn-kit-ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditSubject(s);
                                            }}
                                            title="Edit subject"
                                            aria-label="Edit subject"
                                        >
                                            <Icon name="edit" size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-kit btn-kit-danger-soft"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const ok = await confirm({
                                                    title: "Delete subject?",
                                                    message: (
                                                        <>
                                                            Delete subject <b>{s.name}</b>? This will remove all topics under it. This cannot be undone.
                                                        </>
                                                    ),
                                                    confirmLabel: "Delete",
                                                    destructive: true,
                                                });
                                                if (!ok) return;
                                                try {
                                                    await deleteSubject(s.id);
                                                    showToast("Subject deleted");
                                                    void loadSubjects();
                                                } catch (err2) {
                                                    showToast(
                                                        err2 instanceof Error
                                                            ? err2.message
                                                            : "Failed to delete subject",
                                                        "danger" as never,
                                                    );
                                                }
                                            }}
                                            title="Delete subject"
                                            aria-label="Delete subject"
                                            style={{ height: 26, padding: "0 8px" }}
                                        >
                                            <Icon name="trash" size={12} />
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <div>
                                            {isLoading ? (
                                                <div
                                                    style={{
                                                        padding: "10px 14px 10px 44px",
                                                        fontSize: 12,
                                                        color: "var(--color-ink-mute)",
                                                        borderBottom: "1px solid var(--color-hairline)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <KitSpinner size={12} /> Loading topics…
                                                </div>
                                            ) : topics.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: "10px 14px 10px 44px",
                                                        fontSize: 12,
                                                        color: "var(--color-ink-mute)",
                                                        borderBottom: "1px solid var(--color-hairline)",
                                                    }}
                                                >
                                                    No topics yet. Use the + button on this subject to add one.
                                                </div>
                                            ) : (
                                                topics.map((t) => (
                                                    <div
                                                        key={t.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                            padding: "9px 14px 9px 44px",
                                                            borderBottom: "1px solid var(--color-hairline)",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 5,
                                                                height: 5,
                                                                borderRadius: "50%",
                                                                background: "var(--ink-4)",
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                                color: "var(--ink)",
                                                                flex: 1,
                                                            }}
                                                        >
                                                            {topicLabel(t)}
                                                        </span>
                                                        {t.description ? (
                                                            <span
                                                                style={{
                                                                    fontSize: 11.5,
                                                                    color: "var(--ink-3)",
                                                                    maxWidth: 260,
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {t.description}
                                                            </span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            className="btn-kit btn-kit-ghost"
                                                            onClick={() =>
                                                                setEditTopic({ subjectId: s.id, topic: t })
                                                            }
                                                            aria-label="Edit topic"
                                                            title="Edit topic"
                                                        >
                                                            <Icon name="edit" size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-kit btn-kit-danger-soft"
                                                            onClick={async () => {
                                                                const ok = await confirm({
                                                                    title: "Delete topic?",
                                                                    message: (
                                                                        <>
                                                                            Delete topic <b>{topicLabel(t)}</b>? This cannot be undone.
                                                                        </>
                                                                    ),
                                                                    confirmLabel: "Delete",
                                                                    destructive: true,
                                                                });
                                                                if (!ok) return;
                                                                try {
                                                                    await deleteTopic(t.id);
                                                                    showToast("Topic deleted");
                                                                    void loadTopics(s.id);
                                                                } catch (err2) {
                                                                    showToast(
                                                                        err2 instanceof Error
                                                                            ? err2.message
                                                                            : "Failed to delete",
                                                                        "danger" as never,
                                                                    );
                                                                }
                                                            }}
                                                            aria-label="Delete topic"
                                                            title="Delete topic"
                                                            style={{ height: 26, padding: "0 8px" }}
                                                        >
                                                            <Icon name="trash" size={12} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {newSubjectOpen && (
                <SubjectDialog
                    title="New subject"
                    onClose={() => setNewSubjectOpen(false)}
                    onSubmit={async (name, code) => {
                        await createSubject({ name, code: code || undefined });
                        showToast("Subject created");
                        await loadSubjects();
                        setNewSubjectOpen(false);
                    }}
                />
            )}

            {editSubject && (
                <SubjectDialog
                    title="Edit subject"
                    initialName={editSubject.name}
                    initialCode={editSubject.code ?? ""}
                    onClose={() => setEditSubject(null)}
                    onSubmit={async (name, code) => {
                        await patchSubject(editSubject.id, {
                            name,
                            code: code ? code : null,
                        });
                        showToast("Subject updated");
                        await loadSubjects();
                        setEditSubject(null);
                    }}
                />
            )}

            {newTopicSubjectId && (
                <TopicDialog
                    title="New topic"
                    onClose={() => setNewTopicSubjectId(null)}
                    onSubmit={async (name, description) => {
                        await createTopic({
                            subjectId: newTopicSubjectId,
                            name,
                            description: description || undefined,
                        });
                        showToast("Topic created");
                        await loadTopics(newTopicSubjectId);
                        setNewTopicSubjectId(null);
                    }}
                />
            )}

            {editTopic && (
                <TopicDialog
                    title="Edit topic"
                    initialName={topicLabel(editTopic.topic)}
                    initialDescription={editTopic.topic.description ?? ""}
                    onClose={() => setEditTopic(null)}
                    onSubmit={async (name, description) => {
                        await updateTopic(editTopic.topic.id, {
                            name,
                            description: description || undefined,
                        });
                        showToast("Topic updated");
                        await loadTopics(editTopic.subjectId);
                        setEditTopic(null);
                    }}
                />
            )}

            {toast && <KitToast message={toast.msg} tone={toast.tone} />}
            {confirmEl}
        </div>
    );
}

function SubjectDialog({
    title,
    initialName = "",
    initialCode = "",
    onClose,
    onSubmit,
}: {
    title: string;
    initialName?: string;
    initialCode?: string;
    onClose: () => void;
    onSubmit: (name: string, code: string) => Promise<void>;
}) {
    const [name, setName] = useState(initialName);
    const [code, setCode] = useState(initialCode);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <KitDialog
            title={title}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn-kit btn-kit-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-kit btn-kit-primary"
                        disabled={busy || !name.trim()}
                        onClick={async () => {
                            setBusy(true);
                            setError(null);
                            try {
                                await onSubmit(name.trim(), code.trim());
                            } catch (e) {
                                setError(e instanceof Error ? e.message : "Save failed");
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        {busy ? <KitSpinner size={12} /> : "Save"}
                    </button>
                </>
            }
        >
            {error && <KitErrorBanner message={error} />}
            <KField label="Subject name" required>
                <KitInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </KField>
            <KField label="Subject code" hint="Short identifier shown alongside the subject (optional)">
                <KitInput value={code} onChange={(e) => setCode(e.target.value)} />
            </KField>
        </KitDialog>
    );
}

function TopicDialog({
    title,
    initialName = "",
    initialDescription = "",
    onClose,
    onSubmit,
}: {
    title: string;
    initialName?: string;
    initialDescription?: string;
    onClose: () => void;
    onSubmit: (name: string, description: string) => Promise<void>;
}) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <KitDialog
            title={title}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn-kit btn-kit-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-kit btn-kit-primary"
                        disabled={busy || !name.trim()}
                        onClick={async () => {
                            setBusy(true);
                            setError(null);
                            try {
                                await onSubmit(name.trim(), description.trim());
                            } catch (e) {
                                setError(e instanceof Error ? e.message : "Save failed");
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        {busy ? <KitSpinner size={12} /> : "Save"}
                    </button>
                </>
            }
        >
            {error && <KitErrorBanner message={error} />}
            <KField label="Topic name" required>
                <KitInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </KField>
            <KField label="Description" hint="Optional · shown below the topic name in the tree">
                <KitTextarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </KField>
        </KitDialog>
    );
}
