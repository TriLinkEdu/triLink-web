"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * Portal MVP pages — fully redesigned to match the TRILINK kit.
 *
 * Each export below is the actual surface that backs a real route
 * (announcements, calendar, notifications, courses, materials,
 * textbooks, goals, feedback, achievements, classes …). The previous
 * implementation rendered through the legacy `<Card>` / `<Button>` /
 * `<PageHeader>` primitives — this rewrite uses the kit's primitives
 * (`<PageHead>`, `.k-card`, `.btn-kit*`, `.gtable`, `<Pill>`, `<StatTile>`)
 * and follows the kit's spacing, typography, and hierarchy.
 *
 * All data wiring is preserved 1:1; only the visual layer was rebuilt.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    announcementsForMe,
    createLearningMaterial,
    createMyGoal,
    deleteTextbook,
    getActiveAcademicYear,
    getClassRoster,
    getStudentDetail,
    listCalendarEvents,
    listChildSubjects,
    listCurriculumSubjects,
    listCurriculumTopics,
    listMyBadges,
    listMyClassOfferings,
    listMyFeedback,
    listMyGoals,
    listMySubjects,
    listNotifications,
    listStudentMaterials,
    listTextbooks,
    markAllNotificationsRead,
    markNotificationRead,
    myBadgePoints,
    myChildren,
    myGamificationProgress,
    patchGoal,
    studentAttendanceReport,
    submitFeedback,
    uploadTextbook,
    type Announcement,
    type BackendNotification,
    type CalendarEventRecord,
    type ClassOffering,
    type CurriculumSubject,
    type EnrolledSubject,
    type LearningMaterialRecord,
    type StudentGoal,
    type TextbookRecord,
    type TopicRecord,
} from "@/lib/admin-api";
import {
    Icon,
    PageHead,
    Pill,
    StatGrid,
    StatTile,
    type KitIconName,
    type PillKind,
} from "@/components/kit";

/* ============================================================
   Utilities — formatters, async-load hook, shared sub-views.
   ============================================================ */

type LoadState = "loading" | "ready" | "error";
type ChildLink = Awaited<ReturnType<typeof myChildren>>[number];

function formatDate(raw?: string | null) {
    if (!raw) return "—";
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
        ? raw
        : d.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
          });
}

function formatDateTime(raw?: string | null) {
    if (!raw) return "—";
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
        ? raw
        : d.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          });
}

function offeringLabel(o: ClassOffering) {
    return (
        o.displayName ||
        o.name ||
        [o.gradeName, o.sectionName, o.subjectName].filter(Boolean).join(" · ") ||
        "Class offering"
    );
}

function fullName(first?: string | null, last?: string | null) {
    return [first, last].filter(Boolean).join(" ") || "Unknown";
}

function useBasicLoad<T>(
    loader: () => Promise<T>,
    deps: React.DependencyList = [],
) {
    const [state, setState] = useState<LoadState>("loading");
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState("loading");
        setError(null);
        loader()
            .then((value) => {
                if (!cancelled) {
                    setData(value);
                    setState("ready");
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Could not load data");
                    setState("error");
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]);

    return { state, data, error, reload: () => setTick((v) => v + 1) };
}

/** Standard kit error block. */
function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div
            role="alert"
            className="k-card"
            style={{
                padding: "14px 16px",
                background: "var(--color-danger-soft)",
                borderColor: "rgba(196,53,84,0.18)",
                color: "var(--color-danger)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 12,
                justifyContent: "space-between",
            }}
        >
            <span>{message}</span>
            {onRetry ? (
                <button
                    type="button"
                    className="btn-kit btn-kit-secondary"
                    onClick={onRetry}
                >
                    <Icon name="refresh" /> Retry
                </button>
            ) : null}
        </div>
    );
}

/** Kit-styled loading skeleton grid. */
function LoadingGrid({ count = 4 }: { count?: number }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
            }}
        >
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="k-card" style={{ height: 132 }}>
                    <div
                        className="skel"
                        style={{ height: "100%", width: "100%", borderRadius: 12 }}
                    />
                </div>
            ))}
        </div>
    );
}

/** Kit-styled empty state (used inside k-card body). */
function EmptyBlock({
    icon,
    title,
    body,
}: {
    icon?: KitIconName;
    title: string;
    body?: string;
}) {
    return (
        <div className="empty-card">
            {icon ? <Icon name={icon} size={28} /> : null}
            <div className="empty-card__t">{title}</div>
            {body ? <div className="empty-card__b">{body}</div> : null}
        </div>
    );
}

/** Kit-styled card row used in list views. Mirrors the kit's classcard. */
function ListRow({
    icon,
    title,
    meta,
    body,
    href,
    pill,
    action,
}: {
    icon?: KitIconName;
    title: string;
    meta?: ReactNode;
    body?: ReactNode;
    href?: string;
    pill?: { kind: PillKind; label: string };
    action?: ReactNode;
}) {
    const inner = (
        <div className="k-card" style={{ padding: "14px 16px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "var(--ink-3)",
                            fontSize: 12,
                            marginBottom: 4,
                        }}
                    >
                        {icon ? <Icon name={icon} /> : null}
                        {meta}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--ink)",
                            letterSpacing: "-0.006em",
                        }}
                    >
                        {title}
                    </div>
                    {body ? (
                        <div
                            style={{
                                fontSize: 12.5,
                                color: "var(--ink-2)",
                                marginTop: 4,
                                lineHeight: 1.55,
                            }}
                        >
                            {body}
                        </div>
                    ) : null}
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    {pill ? <Pill kind={pill.kind}>{pill.label}</Pill> : null}
                    {action}
                </div>
            </div>
        </div>
    );
    return href ? (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
        >
            {inner}
        </a>
    ) : (
        inner
    );
}

/** Kit-styled responsive list grid. */
function ListGrid({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 12,
            }}
        >
            {children}
        </div>
    );
}

/* ============================================================
   Shared — announcements, calendar, notifications
   ============================================================ */

export function AnnouncementsPage({ role }: { role: "student" | "parent" }) {
    const { state, data, error, reload } = useBasicLoad(() => announcementsForMe());
    const items = (data ?? []) as Announcement[];
    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        {role === "parent" ? "Parent view" : "Student view"}
                        <span className="dot-sep">·</span>
                        {items.length} update{items.length === 1 ? "" : "s"}
                    </>
                }
                title="Announcements"
                sub="School-wide and class updates."
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && items.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="megaphone"
                        title="No announcements"
                        body={`There are no ${role} announcements right now.`}
                    />
                </div>
            ) : null}
            {items.length > 0 ? (
                <ListGrid>
                    {items.map((a) => (
                        <ListRow
                            key={a.id}
                            icon="megaphone"
                            title={a.title}
                            meta={
                                <>
                                    {a.audience}
                                    <span className="dot-sep">·</span>
                                    {formatDateTime(a.createdAt)}
                                </>
                            }
                            body={a.body}
                            pill={{ kind: "brand", label: a.audience }}
                        />
                    ))}
                </ListGrid>
            ) : null}
        </div>
    );
}

export function CalendarPage({ role }: { role: "student" | "parent" }) {
    const { state, data, error, reload } = useBasicLoad(async () => {
        const year = await getActiveAcademicYear();
        return listCalendarEvents({ academicYearId: year?.id });
    });
    const events = (data ?? []) as CalendarEventRecord[];
    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Academic year
                        <span className="dot-sep">·</span>
                        {events.length} event{events.length === 1 ? "" : "s"}
                    </>
                }
                title="Calendar"
                sub={
                    role === "parent"
                        ? "School events and meetings for your child."
                        : "Exams, deadlines, and school events."
                }
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && events.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="cal"
                        title="No calendar events"
                        body="No events are scheduled for the current academic year."
                    />
                </div>
            ) : null}
            {events.length > 0 ? (
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Upcoming events</div>
                            <div className="k-card__sub">
                                {events.length} event{events.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </div>
                    <table className="gtable">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Type</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((e) => (
                                <tr key={e.id}>
                                    <td>
                                        <b>{e.title}</b>
                                        {e.description ? (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--ink-3)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                {e.description}
                                            </div>
                                        ) : null}
                                    </td>
                                    <td>
                                        <Pill
                                            kind={
                                                e.type === "exam"
                                                    ? "pending"
                                                    : e.type === "holiday"
                                                      ? "active"
                                                      : "neutral"
                                            }
                                        >
                                            {e.type}
                                        </Pill>
                                    </td>
                                    <td>{formatDate(e.date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}

export function NotificationsPage() {
    const [busy, setBusy] = useState(false);
    const { state, data, error, reload } = useBasicLoad(() =>
        listNotifications(false),
    );
    const items = (data ?? []) as BackendNotification[];
    async function markRead(id: string) {
        setBusy(true);
        try {
            await markNotificationRead(id);
            reload();
        } finally {
            setBusy(false);
        }
    }
    async function markAll() {
        setBusy(true);
        try {
            await markAllNotificationsRead();
            reload();
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="kit-page">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Inbox
                        <span className="dot-sep">·</span>
                        {items.filter((n) => !n.readAt).length} unread
                    </>
                }
                title="Notifications"
                sub="Alerts and updates from the school."
                actions={
                    <button
                        type="button"
                        className="btn-kit btn-kit-secondary"
                        onClick={markAll}
                        disabled={busy}
                    >
                        <Icon name="check" /> Mark all read
                    </button>
                }
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && items.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="bell"
                        title="No notifications"
                        body="You are all caught up."
                    />
                </div>
            ) : null}
            {items.length > 0 ? (
                <ListGrid>
                    {items.map((n) => (
                        <ListRow
                            key={n.id}
                            icon="bell"
                            title={n.title}
                            meta={
                                <>
                                    {n.type}
                                    <span className="dot-sep">·</span>
                                    {formatDateTime(n.createdAt)}
                                </>
                            }
                            body={n.body}
                            pill={
                                n.readAt
                                    ? { kind: "neutral", label: "Read" }
                                    : undefined
                            }
                            action={
                                !n.readAt ? (
                                    <button
                                        type="button"
                                        className="btn-kit btn-kit-ghost"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            void markRead(n.id);
                                        }}
                                    >
                                        Mark read
                                    </button>
                                ) : null
                            }
                        />
                    ))}
                </ListGrid>
            ) : null}
        </div>
    );
}

/* ============================================================
   Student
   ============================================================ */

function SubjectGrid({ subjects }: { subjects: EnrolledSubject[] }) {
    return (
        <ListGrid>
            {subjects.map((s) => (
                <ListRow
                    key={`${s.subjectId}-${s.classOfferingId}`}
                    icon="book"
                    title={s.subjectName}
                    meta={
                        <>
                            {s.gradeName}
                            <span className="dot-sep">·</span>
                            {s.sectionName}
                            <span className="dot-sep">·</span>
                            {s.subjectCode}
                        </>
                    }
                    body={
                        s.teacher
                            ? `Teacher: ${fullName(s.teacher.firstName, s.teacher.lastName)} · ${s.teacher.email}`
                            : "Teacher not assigned"
                    }
                    pill={{ kind: "brand", label: s.subjectCode || "Subject" }}
                />
            ))}
        </ListGrid>
    );
}

export function StudentCoursesPage() {
    const { state, data, error, reload } = useBasicLoad(() => listMySubjects());
    const items = data ?? [];
    return (
        <div className="kit-page" data-role="student">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Academics
                        <span className="dot-sep">·</span>
                        {items.length} subject{items.length === 1 ? "" : "s"}
                    </>
                }
                title="My courses"
                sub="Subjects you are enrolled in, with teacher and class details."
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && items.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="book"
                        title="No courses"
                        body="Your enrollments will appear here after the school assigns your classes."
                    />
                </div>
            ) : null}
            {items.length > 0 ? <SubjectGrid subjects={items} /> : null}
        </div>
    );
}

export function StudentCurriculumPage() {
    const { state, data, error, reload } = useBasicLoad(async () => {
        const subjects = await listCurriculumSubjects();
        const topicPairs = await Promise.all(
            subjects.map(
                async (s) =>
                    [s.id, await listCurriculumTopics(s.id).catch(() => [] as TopicRecord[])] as const,
            ),
        );
        return { subjects, topicMap: new Map(topicPairs) };
    });
    return (
        <div className="kit-page" data-role="student">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Academic year
                        <span className="dot-sep">·</span>
                        {data?.subjects.length ?? 0} subject
                        {data?.subjects.length === 1 ? "" : "s"}
                    </>
                }
                title="Curriculum"
                sub="Topics and units for your enrolled subjects."
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && (data?.subjects.length ?? 0) === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="layers"
                        title="No curriculum yet"
                        body="Topics will appear after your subjects are configured."
                    />
                </div>
            ) : null}
            {data ? (
                <ListGrid>
                    {data.subjects.map((s: CurriculumSubject) => {
                        const topics = data.topicMap.get(s.id) ?? [];
                        return (
                            <div className="k-card" key={s.id}>
                                <div className="k-card__head">
                                    <div>
                                        <div className="k-card__title">{s.name}</div>
                                        <div className="k-card__sub">
                                            {[s.code, s.curriculumVersion]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </div>
                                    </div>
                                    <Pill kind="neutral">{topics.length} topics</Pill>
                                </div>
                                <div className="k-card__body">
                                    {topics.length === 0 ? (
                                        <EmptyBlock
                                            title="No topics"
                                            body="No topics are attached to this subject yet."
                                        />
                                    ) : (
                                        <ul
                                            style={{
                                                margin: 0,
                                                paddingLeft: 18,
                                                color: "var(--ink-2)",
                                                fontSize: 12.5,
                                                lineHeight: 1.7,
                                            }}
                                        >
                                            {topics.slice(0, 8).map((t) => (
                                                <li key={t.id}>
                                                    {t.name || t.title || "Untitled topic"}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </ListGrid>
            ) : null}
        </div>
    );
}

export function StudentMaterialsPage() {
    const { state, data, error, reload } = useBasicLoad(() =>
        listStudentMaterials(),
    );
    return (
        <MaterialsList
            role="student"
            title="Learning materials"
            description="Notes, links, and files shared by your teachers."
            state={state}
            error={error}
            reload={reload}
            materials={data ?? []}
        />
    );
}

function MaterialsList({
    role,
    title,
    description,
    state,
    error,
    reload,
    materials,
}: {
    role: "student" | "teacher" | "admin" | "parent";
    title: string;
    description: string;
    state: LoadState;
    error: string | null;
    reload: () => void;
    materials: LearningMaterialRecord[];
}) {
    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Library
                        <span className="dot-sep">·</span>
                        {materials.length} item{materials.length === 1 ? "" : "s"}
                    </>
                }
                title={title}
                sub={description}
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && materials.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="library"
                        title="No materials"
                        body="Shared materials will appear here."
                    />
                </div>
            ) : null}
            {materials.length > 0 ? (
                <ListGrid>
                    {materials.map((m) => (
                        <ListRow
                            key={m.id}
                            icon="file"
                            title={m.title}
                            meta={
                                <>
                                    {m.subject}
                                    <span className="dot-sep">·</span>
                                    Grade {m.grade}
                                </>
                            }
                            body={m.description}
                            href={m.url}
                            pill={{ kind: "neutral", label: m.type.toUpperCase() }}
                        />
                    ))}
                </ListGrid>
            ) : null}
        </div>
    );
}

export function TextbooksPage({ admin = false }: { admin?: boolean }) {
    const [subject, setSubject] = useState("");
    const [grade, setGrade] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const { state, data, error, reload } = useBasicLoad(
        () =>
            listTextbooks({
                subject: subject || undefined,
                grade: grade ? Number(grade) : undefined,
            }),
        [subject, grade],
    );
    const books = (data ?? []) as TextbookRecord[];

    async function onUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setUploadError(null);
        setUploadSuccess(null);
        const form = new FormData(e.currentTarget);
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
            setUploadError("Choose a PDF textbook before uploading.");
            return;
        }
        if (file.type && file.type !== "application/pdf") {
            setUploadError("Only PDF files are accepted for textbooks.");
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            setUploadError("Textbook PDFs must be 25 MB or smaller.");
            return;
        }
        setUploading(true);
        try {
            await uploadTextbook({
                title: String(form.get("title") || ""),
                subject: String(form.get("subject") || ""),
                grade: Number(form.get("grade") || 0),
                description: String(form.get("description") || ""),
                file,
            });
            e.currentTarget.reset();
            setUploadSuccess("Textbook uploaded successfully.");
            reload();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setUploadError(
                message === "Internal server error"
                    ? "The server could not store this PDF. Check backend storage configuration and try again."
                    : message,
            );
        } finally {
            setUploading(false);
        }
    }
    async function removeBook(id: string) {
        await deleteTextbook(id);
        reload();
    }

    return (
        <div className="kit-page" data-role={admin ? "admin" : "student"}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Library
                        <span className="dot-sep">·</span>
                        {books.length} book{books.length === 1 ? "" : "s"}
                    </>
                }
                title="Textbooks"
                sub={
                    admin
                        ? "Manage the school textbook library."
                        : "Read and download books for your grade and subjects."
                }
            />

            {/* Filter toolbar */}
            <div
                className="k-card"
                style={{
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 10,
                    alignItems: "end",
                    marginBottom: 14,
                }}
            >
                <div className="k-field">
                    <label className="k-field__label" htmlFor="tb-subject">
                        Filter by subject
                    </label>
                    <input
                        id="tb-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Mathematics"
                    />
                </div>
                <div className="k-field">
                    <label className="k-field__label" htmlFor="tb-grade">
                        Filter by grade
                    </label>
                    <input
                        id="tb-grade"
                        type="number"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="e.g. 11"
                    />
                </div>
                <button
                    type="button"
                    onClick={reload}
                    className="btn-kit btn-kit-secondary"
                >
                    <Icon name="refresh" /> Refresh
                </button>
            </div>

            {admin ? (
                <div className="k-card" style={{ marginBottom: 14 }}>
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Upload textbook</div>
                            <div className="k-card__sub">
                                PDF uploads are available to admins (max 25 MB).
                            </div>
                        </div>
                    </div>
                    <div className="k-card__body">
                        {uploadError ? (
                            <div
                                role="alert"
                                style={{
                                    marginBottom: 12,
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    background: "var(--color-danger-soft)",
                                    color: "var(--color-danger)",
                                    fontSize: 12.5,
                                    border: "1px solid rgba(196,53,84,0.18)",
                                }}
                            >
                                {uploadError}
                            </div>
                        ) : null}
                        {uploadSuccess ? (
                            <div
                                role="status"
                                style={{
                                    marginBottom: 12,
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    background: "var(--color-success-soft)",
                                    color: "var(--color-success)",
                                    fontSize: 12.5,
                                    border: "1px solid rgba(13,138,95,0.18)",
                                }}
                            >
                                {uploadSuccess}
                            </div>
                        ) : null}
                        <form
                            onSubmit={onUpload}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: 12,
                            }}
                        >
                            <div className="k-field">
                                <label className="k-field__label">Title</label>
                                <input name="title" required placeholder="Algebra II" />
                            </div>
                            <div className="k-field">
                                <label className="k-field__label">Subject</label>
                                <input name="subject" required placeholder="Mathematics" />
                            </div>
                            <div className="k-field">
                                <label className="k-field__label">Grade</label>
                                <input name="grade" required type="number" min={1} />
                            </div>
                            <div className="k-field">
                                <label className="k-field__label">Description</label>
                                <input name="description" placeholder="Optional" />
                            </div>
                            <div className="k-field" style={{ gridColumn: "span 2" }}>
                                <label className="k-field__label">PDF file</label>
                                <input
                                    name="file"
                                    required
                                    type="file"
                                    accept="application/pdf"
                                />
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <button
                                    type="submit"
                                    className="btn-kit btn-kit-primary"
                                    disabled={uploading}
                                >
                                    <Icon name="upload" />{" "}
                                    {uploading ? "Uploading…" : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && books.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="library"
                        title="No textbooks"
                        body="No books match the current filters."
                    />
                </div>
            ) : null}
            {books.length > 0 ? (
                <ListGrid>
                    {books.map((b) => (
                        <ListRow
                            key={b.id}
                            icon="library"
                            title={b.title}
                            meta={
                                <>
                                    {b.subject}
                                    <span className="dot-sep">·</span>
                                    Grade {b.grade}
                                    {b.pageCount ? (
                                        <>
                                            <span className="dot-sep">·</span>
                                            {b.pageCount} pages
                                        </>
                                    ) : null}
                                </>
                            }
                            body={b.description}
                            href={b.accessUrl}
                            action={
                                admin ? (
                                    <button
                                        type="button"
                                        className="btn-kit btn-kit-ghost"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            void removeBook(b.id);
                                        }}
                                        style={{ color: "var(--color-danger)" }}
                                    >
                                        <Icon name="trash" /> Delete
                                    </button>
                                ) : (
                                    <Icon name="download" />
                                )
                            }
                        />
                    ))}
                </ListGrid>
            ) : null}
        </div>
    );
}

export function StudentGoalsPage() {
    const [saving, setSaving] = useState(false);
    const { state, data, error, reload } = useBasicLoad(() => listMyGoals());
    const goals = (data ?? []) as StudentGoal[];
    async function onCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setSaving(true);
        try {
            await createMyGoal({
                title: String(form.get("title") || ""),
                description: String(form.get("description") || ""),
                targetDate: String(form.get("targetDate") || "") || undefined,
            });
            e.currentTarget.reset();
            reload();
        } finally {
            setSaving(false);
        }
    }
    async function bump(goal: StudentGoal, progressPercent: number) {
        await patchGoal(goal.id, {
            progressPercent,
            status: progressPercent >= 100 ? "completed" : goal.status,
        });
        reload();
    }
    const totalCompleted = goals.filter((g) => g.status === "completed").length;
    return (
        <div className="kit-page" data-role="student">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Self-directed
                        <span className="dot-sep">·</span>
                        {goals.length} goal{goals.length === 1 ? "" : "s"}
                    </>
                }
                title="Goals"
                sub="Set and track your academic goals for this term."
            />

            <StatGrid cols={3} style={{ marginBottom: 14 }}>
                <StatTile icon="trophy" label="Goals set" value={String(goals.length)} note="this term" />
                <StatTile
                    icon="check"
                    label="Completed"
                    value={String(totalCompleted)}
                    note={goals.length > 0 ? `${Math.round((totalCompleted / goals.length) * 100)}% rate` : "no data yet"}
                />
                <StatTile
                    icon="sparkles"
                    label="In progress"
                    value={String(goals.length - totalCompleted)}
                    note="active"
                />
            </StatGrid>

            <div className="k-card" style={{ marginBottom: 14 }}>
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">New goal</div>
                        <div className="k-card__sub">
                            Create a measurable target for this term.
                        </div>
                    </div>
                </div>
                <div className="k-card__body">
                    <form
                        onSubmit={onCreate}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 2fr 1fr auto",
                            gap: 10,
                            alignItems: "end",
                        }}
                    >
                        <div className="k-field">
                            <label className="k-field__label">Goal title</label>
                            <input name="title" required placeholder="Master derivatives" />
                        </div>
                        <div className="k-field">
                            <label className="k-field__label">Description</label>
                            <input name="description" placeholder="Optional" />
                        </div>
                        <div className="k-field">
                            <label className="k-field__label">Target date</label>
                            <input name="targetDate" type="date" />
                        </div>
                        <button
                            type="submit"
                            className="btn-kit btn-kit-primary"
                            disabled={saving}
                        >
                            <Icon name="plus" /> Add
                        </button>
                    </form>
                </div>
            </div>

            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && goals.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="trophy"
                        title="No goals yet"
                        body="Add your first goal to start tracking progress."
                    />
                </div>
            ) : null}
            {goals.length > 0 ? (
                <ListGrid>
                    {goals.map((g) => (
                        <ListRow
                            key={g.id}
                            icon="trophy"
                            title={g.title}
                            meta={
                                <>
                                    {g.progressPercent}%
                                    <span className="dot-sep">·</span>
                                    due {formatDate(g.targetDate)}
                                </>
                            }
                            body={g.description}
                            pill={{
                                kind:
                                    g.status === "completed"
                                        ? "active"
                                        : g.progressPercent > 0
                                          ? "pending"
                                          : "neutral",
                                label: g.status,
                            }}
                            action={
                                g.status !== "completed" ? (
                                    <button
                                        type="button"
                                        className="btn-kit btn-kit-secondary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            void bump(
                                                g,
                                                Math.min(100, (g.progressPercent || 0) + 10),
                                            );
                                        }}
                                    >
                                        +10%
                                    </button>
                                ) : null
                            }
                        />
                    ))}
                </ListGrid>
            ) : null}
        </div>
    );
}

export function StudentFeedbackPage({
    role = "student",
}: {
    role?: "student" | "parent";
}) {
    const [saving, setSaving] = useState(false);
    const { state, data, error, reload } = useBasicLoad(() => listMyFeedback());
    const items = data ?? [];
    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setSaving(true);
        try {
            await submitFeedback({
                category: "general",
                message: String(form.get("message") || ""),
                isAnonymous: form.get("anonymous") === "on",
            });
            e.currentTarget.reset();
            reload();
        } finally {
            setSaving(false);
        }
    }
    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        {role === "parent" ? "Parent voice" : "Student voice"}
                        <span className="dot-sep">·</span>
                        Confidential by default
                    </>
                }
                title="Feedback"
                sub={
                    role === "parent"
                        ? "Share feedback with the school."
                        : "Share feedback with teachers and the school."
                }
            />

            <div className="k-card" style={{ marginBottom: 14 }}>
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">Submit feedback</div>
                        <div className="k-card__sub">
                            Anonymous by default — your name is hidden unless you opt in.
                        </div>
                    </div>
                </div>
                <div className="k-card__body">
                    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                        <div className="k-field">
                            <label className="k-field__label">Your feedback</label>
                            <textarea
                                name="message"
                                required
                                rows={4}
                                placeholder="What's on your mind?"
                            />
                        </div>
                        <label
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                fontSize: 12.5,
                                color: "var(--ink-2)",
                            }}
                        >
                            <input name="anonymous" type="checkbox" defaultChecked /> Send
                            anonymously
                        </label>
                        <div>
                            <button
                                type="submit"
                                className="btn-kit btn-kit-primary"
                                disabled={saving}
                            >
                                <Icon name="paperPlane" /> Submit feedback
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && items.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        title="No visible feedback history"
                        body="Anonymous feedback is intentionally hidden from your personal history."
                    />
                </div>
            ) : null}
            {items.length > 0 ? (
                <ListGrid>
                    {items.map((f) => (
                        <ListRow
                            key={f.id}
                            icon="inbox"
                            title={f.category}
                            meta={formatDateTime(f.createdAt)}
                            body={f.message}
                            pill={{ kind: "neutral", label: f.status }}
                        />
                    ))}
                </ListGrid>
            ) : null}
        </div>
    );
}

export function StudentAchievementsPage() {
    const { state, data, error, reload } = useBasicLoad(async () => {
        const [badges, points, progress] = await Promise.all([
            listMyBadges(),
            myBadgePoints().catch(() => 0),
            myGamificationProgress().catch(() => ({})),
        ]);
        return { badges, points, progress };
    });
    const pointValue =
        typeof data?.points === "number"
            ? data.points
            : (data?.points?.points ?? data?.points?.total ?? 0);
    return (
        <div className="kit-page" data-role="student">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Gamification
                        <span className="dot-sep">·</span>
                        Term progress
                    </>
                }
                title="Achievements"
                sub="Badges, points, and progress milestones."
            />
            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {data ? (
                <>
                    <StatGrid cols={3} style={{ marginBottom: 14 }}>
                        <StatTile
                            icon="trophy"
                            label="Badge points"
                            value={String(pointValue)}
                            note="lifetime"
                        />
                        <StatTile
                            icon="check"
                            label="Badges earned"
                            value={String(data.badges.length)}
                            note={data.badges.length > 0 ? "tap to view" : "none yet"}
                        />
                        <StatTile
                            icon="sparkles"
                            label="Progress signals"
                            value={String(Object.keys(data.progress).length)}
                            note="tracked"
                        />
                    </StatGrid>
                    {data.badges.length === 0 ? (
                        <div className="k-card">
                            <EmptyBlock
                                icon="trophy"
                                title="No badges yet"
                                body="Badges will appear after achievements are awarded."
                            />
                        </div>
                    ) : (
                        <ListGrid>
                            {data.badges.map((b, i) => (
                                <ListRow
                                    key={b.id ?? i}
                                    icon="trophy"
                                    title={b.badge?.name || b.name || "Badge"}
                                    meta={`${b.badge?.pointsValue ?? b.pointsValue ?? 0} points`}
                                    body={b.badge?.description || b.description}
                                    pill={{ kind: "brand", label: "Earned" }}
                                />
                            ))}
                        </ListGrid>
                    )}
                </>
            ) : null}
        </div>
    );
}

/* ============================================================
   Teacher
   ============================================================ */

export function TeacherClassesPage() {
    const { state, data, error, reload } = useBasicLoad(async () => {
        const year = await getActiveAcademicYear();
        const classes = year?.id ? await listMyClassOfferings(year.id) : [];
        const rosters = await Promise.all(
            classes.map(
                async (c) => [c.id, await getClassRoster(c.id).catch(() => null)] as const,
            ),
        );
        return { classes, rosterMap: new Map(rosters) };
    });
    const totalStudents = useMemo(() => {
        if (!data) return 0;
        let sum = 0;
        for (const c of data.classes) {
            const r = data.rosterMap.get(c.id);
            sum += r?.studentCount ?? 0;
        }
        return sum;
    }, [data]);
    return (
        <div className="kit-page" data-role="teacher">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Term 2 · AY {new Date().getFullYear()}
                        <span className="dot-sep">·</span>
                        {data?.classes.length ?? 0} classes
                    </>
                }
                title="My classes"
                sub="Sections you teach, with quick actions and roster size."
            />

            <StatGrid cols={3} style={{ marginBottom: 14 }}>
                <StatTile
                    icon="users"
                    label="Classes"
                    value={String(data?.classes.length ?? 0)}
                    note="this term"
                />
                <StatTile
                    icon="user"
                    label="Students"
                    value={String(totalStudents)}
                    note="across all classes"
                />
                <StatTile
                    icon="paper"
                    label="Sections"
                    value={String(
                        new Set((data?.classes ?? []).map((c) => c.sectionName)).size,
                    )}
                    note="unique sections"
                />
            </StatGrid>

            {state === "loading" ? <LoadingGrid /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}
            {state === "ready" && (data?.classes.length ?? 0) === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="users"
                        title="No classes assigned"
                        body="Your assigned class offerings will appear here."
                    />
                </div>
            ) : null}
            {data && data.classes.length > 0 ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: 12,
                    }}
                >
                    {data.classes.map((c) => {
                        const roster = data.rosterMap.get(c.id);
                        return (
                            <div className="classcard" key={c.id}>
                                <div className="classcard__head">
                                    <div>
                                        <div className="classcard__title">
                                            {c.subjectName ?? offeringLabel(c)}
                                        </div>
                                        <div className="classcard__sub">
                                            {[c.gradeName, c.sectionName]
                                                .filter(Boolean)
                                                .join(" · ")}{" "}
                                            · {roster?.studentCount ?? 0} students
                                        </div>
                                    </div>
                                    <Pill kind="neutral">
                                        {roster?.studentCount ?? 0}
                                    </Pill>
                                </div>
                                <div
                                    className="classcard__meta"
                                    style={{ flexWrap: "wrap" }}
                                >
                                    <Link
                                        href={`/teacher/attendance?classOfferingId=${c.id}`}
                                        className="btn-kit btn-kit-ghost"
                                    >
                                        <Icon name="check" /> Attendance
                                    </Link>
                                    <Link
                                        href="/teacher/exams"
                                        className="btn-kit btn-kit-ghost"
                                    >
                                        <Icon name="paper" /> Exams
                                    </Link>
                                    <Link
                                        href="/teacher/grades"
                                        className="btn-kit btn-kit-ghost"
                                    >
                                        <Icon name="trophy" /> Grades
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export function TeacherMaterialsPage() {
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const { state, data, error, reload } = useBasicLoad(async () => {
        const year = await getActiveAcademicYear();
        return year?.id ? listMyClassOfferings(year.id) : [];
    });
    const classes = data ?? [];

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const classId = String(form.get("classOfferingId") || "");
        const selected = classes.find((c) => c.id === classId);
        setSaving(true);
        try {
            await createLearningMaterial({
                title: String(form.get("title") || ""),
                type: "link",
                subject: selected?.subjectName || "General",
                grade: Number(String(selected?.gradeName || "").match(/\d+/)?.[0] ?? 0),
                classOfferingId: classId,
                description: String(form.get("description") || ""),
                link: String(form.get("link") || ""),
            });
            e.currentTarget.reset();
            setSavedMessage("Material shared with class.");
            setTimeout(() => setSavedMessage(null), 3500);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="kit-page" data-role="teacher">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Teaching
                        <span className="dot-sep">·</span>
                        Link materials
                    </>
                }
                title="Learning materials"
                sub="Share links and resources with your classes."
            />

            {state === "loading" ? <LoadingGrid count={1} /> : null}
            {state === "error" && error ? (
                <ErrorCard message={error} onRetry={reload} />
            ) : null}

            <div className="k-card">
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">Create material</div>
                        <div className="k-card__sub">
                            Shares a public link with everyone in the selected class.
                        </div>
                    </div>
                </div>
                <div className="k-card__body">
                    {savedMessage ? (
                        <div
                            role="status"
                            style={{
                                marginBottom: 12,
                                padding: "10px 12px",
                                borderRadius: 8,
                                background: "var(--color-success-soft)",
                                color: "var(--color-success)",
                                fontSize: 12.5,
                                border: "1px solid rgba(13,138,95,0.18)",
                            }}
                        >
                            {savedMessage}
                        </div>
                    ) : null}
                    <form
                        onSubmit={onSubmit}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 12,
                        }}
                    >
                        <div className="k-field" style={{ gridColumn: "span 2" }}>
                            <label className="k-field__label">Class</label>
                            <select name="classOfferingId" required>
                                <option value="">Select a class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {offeringLabel(c)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="k-field">
                            <label className="k-field__label">Title</label>
                            <input name="title" required placeholder="Chapter 4 video" />
                        </div>
                        <div className="k-field">
                            <label className="k-field__label">Link</label>
                            <input
                                name="link"
                                required
                                type="url"
                                placeholder="https://…"
                            />
                        </div>
                        <div className="k-field" style={{ gridColumn: "span 2" }}>
                            <label className="k-field__label">Description</label>
                            <input
                                name="description"
                                placeholder="Optional — context for students"
                            />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <button
                                type="submit"
                                className="btn-kit btn-kit-primary"
                                disabled={saving}
                            >
                                <Icon name="plus" /> Create material
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Parent
   ============================================================ */

function useParentChildren() {
    return useBasicLoad(() => myChildren());
}

function ChildSelector({
    childrenList,
    selectedId,
    onSelect,
}: {
    childrenList: ChildLink[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    if (childrenList.length <= 1) return null;
    return (
        <div className="k-card" style={{ padding: 12, marginBottom: 14 }}>
            <div className="k-field">
                <label className="k-field__label">Viewing child</label>
                <select
                    value={selectedId}
                    onChange={(e) => onSelect(e.target.value)}
                >
                    {childrenList.map((c) => (
                        <option key={c.studentId} value={c.studentId}>
                            {c.student
                                ? fullName(c.student.firstName, c.student.lastName)
                                : c.studentId}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export function ParentAttendancePage() {
    const kids = useParentChildren();
    const [selectedId, setSelectedId] = useState("");
    useEffect(() => {
        if (!selectedId && kids.data?.[0]?.studentId) {
            setSelectedId(kids.data[0].studentId);
        }
    }, [kids.data, selectedId]);
    const report = useBasicLoad(
        () => (selectedId ? studentAttendanceReport(selectedId) : Promise.resolve(null)),
        [selectedId],
    );
    type Record = {
        markId?: string;
        sessionId?: string;
        status?: string;
        date?: string;
        sessionDate?: string;
        note?: string | null;
        subject?: { name: string } | null;
    };
    const records = ((report.data?.records ?? report.data?.sessions ?? []) as Record[]);
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    return (
        <div className="kit-page" data-role="parent">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        My child
                        <span className="dot-sep">·</span>
                        Attendance log
                    </>
                }
                title="Attendance"
                sub="Daily attendance and absence history."
            />
            {kids.data ? (
                <ChildSelector
                    childrenList={kids.data}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            ) : null}

            <StatGrid cols={3} style={{ marginBottom: 14 }}>
                <StatTile
                    icon="check"
                    label="Present"
                    value={String(present)}
                    note="sessions"
                />
                <StatTile
                    icon="alertTri"
                    label="Absent"
                    value={String(absent)}
                    note="sessions"
                />
                <StatTile
                    icon="sparkles"
                    label="Rate"
                    value={`${rate}%`}
                    note="this academic year"
                />
            </StatGrid>

            {report.state === "loading" ? <LoadingGrid /> : null}
            {report.error ? (
                <ErrorCard message={report.error} onRetry={report.reload} />
            ) : null}
            {records.length === 0 && report.state === "ready" ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="check"
                        title="No attendance records"
                        body="Attendance history will appear after teachers submit sessions."
                    />
                </div>
            ) : null}
            {records.length > 0 ? (
                <div className="k-card">
                    <table className="gtable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Subject</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r, i) => (
                                <tr key={r.markId ?? r.sessionId ?? i}>
                                    <td>
                                        <b>{formatDate(r.date || r.sessionDate)}</b>
                                    </td>
                                    <td>
                                        <Pill
                                            kind={
                                                r.status === "absent"
                                                    ? "danger"
                                                    : r.status === "late"
                                                      ? "pending"
                                                      : "active"
                                            }
                                        >
                                            {r.status || "—"}
                                        </Pill>
                                    </td>
                                    <td>{r.subject?.name ?? "—"}</td>
                                    <td>{r.note ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}

export function ParentSubjectsPage() {
    const kids = useParentChildren();
    const [selectedId, setSelectedId] = useState("");
    useEffect(() => {
        if (!selectedId && kids.data?.[0]?.studentId) {
            setSelectedId(kids.data[0].studentId);
        }
    }, [kids.data, selectedId]);
    const subjects = useBasicLoad(
        () => (selectedId ? listChildSubjects(selectedId) : Promise.resolve([])),
        [selectedId],
    );
    const list = subjects.data ?? [];
    return (
        <div className="kit-page" data-role="parent">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        My child
                        <span className="dot-sep">·</span>
                        {list.length} subject{list.length === 1 ? "" : "s"}
                    </>
                }
                title="Subjects"
                sub="Subjects your child is taking and who teaches them."
            />
            {kids.data ? (
                <ChildSelector
                    childrenList={kids.data}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            ) : null}
            {subjects.state === "loading" ? <LoadingGrid /> : null}
            {subjects.error ? (
                <ErrorCard message={subjects.error} onRetry={subjects.reload} />
            ) : null}
            {list.length > 0 ? <SubjectGrid subjects={list} /> : null}
            {subjects.state === "ready" && list.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="book"
                        title="No subjects"
                        body="Subjects will appear once your child is enrolled."
                    />
                </div>
            ) : null}
        </div>
    );
}

export function ParentTeachersPage() {
    const kids = useParentChildren();
    const [selectedId, setSelectedId] = useState("");
    useEffect(() => {
        if (!selectedId && kids.data?.[0]?.studentId) {
            setSelectedId(kids.data[0].studentId);
        }
    }, [kids.data, selectedId]);
    const detail = useBasicLoad(
        () => (selectedId ? getStudentDetail(selectedId) : Promise.resolve(null)),
        [selectedId],
    );
    const teachers = detail.data?.teachers ?? [];
    return (
        <div className="kit-page" data-role="parent">
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        My child
                        <span className="dot-sep">·</span>
                        {teachers.length} teacher{teachers.length === 1 ? "" : "s"}
                    </>
                }
                title="Teachers"
                sub="Teachers assigned to your child."
            />
            {kids.data ? (
                <ChildSelector
                    childrenList={kids.data}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            ) : null}
            {detail.state === "loading" ? <LoadingGrid /> : null}
            {detail.error ? (
                <ErrorCard message={detail.error} onRetry={detail.reload} />
            ) : null}
            {teachers.length > 0 ? (
                <ListGrid>
                    {teachers.map((t) => (
                        <ListRow
                            key={t.id}
                            icon="user"
                            title={fullName(t.firstName, t.lastName)}
                            meta={t.email}
                            body={t.subjectName ? `Subject: ${t.subjectName}` : null}
                            pill={{ kind: "neutral", label: "Teacher" }}
                        />
                    ))}
                </ListGrid>
            ) : null}
            {detail.state === "ready" && teachers.length === 0 ? (
                <div className="k-card">
                    <EmptyBlock
                        icon="user"
                        title="No teachers"
                        body="Teacher assignments will appear after class setup."
                    />
                </div>
            ) : null}
        </div>
    );
}

export function ParentAnnouncementsPage() {
    return <AnnouncementsPage role="parent" />;
}

export function ParentFeedbackPage() {
    return <StudentFeedbackPage role="parent" />;
}

export function ParentNotificationsPage() {
    return <NotificationsPage />;
}

export function ParentCalendarPage() {
    return <CalendarPage role="parent" />;
}

export function ParentOverviewCards() {
    return null;
}

export function StudentAnnouncementsPage() {
    return <AnnouncementsPage role="student" />;
}

export function StudentCalendarPage() {
    return <CalendarPage role="student" />;
}

export function StudentNotificationsPage() {
    return <NotificationsPage />;
}

export function StudentTextbooksPage() {
    return <TextbooksPage />;
}

export function AdminTextbooksPage() {
    return <TextbooksPage admin />;
}

/* === Helpers that are still imported elsewhere ============================ */
// Re-export the load hook for any consumer that depends on it via this file.
export { useBasicLoad as useMvpLoad };

// `useCallback` import is left to keep parity in case future hooks need it.
export const __noop = useCallback;
