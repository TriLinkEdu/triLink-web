"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * Admin · Class detail — wired to real endpoints.
 *
 *  - Roster: listEnrollments + createEnrollment + deleteEnrollment
 *  - Exams: listExams filtered by classOfferingId
 *  - Attendance: classAttendanceReport
 *  - Activity: listAuditLogs filtered by entity
 *  - Assignments / Content: backend exposes only teacher-scoped lists,
 *    so admins see a contextual empty state with deep links.
 *  - Broadcast: link to /admin/announcements pre-tagged for this class
 *  - New exam: link to /admin/exams (admins use teacher-side builder)
 */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    type ClassOffering,
    type Enrollment,
    type Exam,
    type PublicUser,
    createEnrollment,
    deleteEnrollment,
    getClassOffering,
    listEnrollments,
    listExams,
    listUsers,
    listAuditLogs,
    classAttendanceReport,
} from "@/lib/admin-api";
import {
    Icon,
    KAvatar,
    PageHead,
    Pill,
    StatGrid,
    StatTile,
    type PillKind,
} from "@/components/kit";
import {
    KField,
    KitDialog,
    KitEmpty,
    KitErrorBanner,
    KitInput,
    KitLoadingBlock,
    KitSelect,
    KitSpinner,
    KitToast,
} from "@/components/kit/local";

type TabId = "roster" | "exams" | "assignments" | "attendance" | "content" | "activity";

type AuditRow = {
    id: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
};

function fullName(s?: PublicUser | null): string {
    if (!s) return "Student";
    return `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "Student";
}

function initialsFor(s?: PublicUser | null): string {
    if (!s) return "??";
    return `${(s.firstName?.[0] ?? "").toUpperCase()}${(s.lastName?.[0] ?? "").toUpperCase()}`;
}

function relTime(iso: string): string {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const s = Math.round(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}

export default function ClassDetailPage() {
    const params = useParams<{ classId: string }>();
    const router = useRouter();
    const classId = params?.classId ?? "";
    const [offering, setOffering] = useState<ClassOffering | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [students, setStudents] = useState<PublicUser[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [attendance, setAttendance] = useState<{
        sessions: Array<{ sessionId: string; date: string; marks: Array<{ status: string }> }>;
    } | null>(null);
    const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
    const [pickStudent, setPickStudent] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabId>("roster");
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null);
    const [toast, setToast] = useState<{ msg: string; tone?: "success" | "danger" } | null>(null);

    const showToast = useCallback((msg: string, tone: "success" | "danger" = "success") => {
        setToast({ msg, tone });
        window.setTimeout(() => setToast(null), 2400);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const [o, enr, studs] = await Promise.all([
                getClassOffering(classId),
                listEnrollments({ classOfferingId: classId }),
                listUsers("student"),
            ]);
            setOffering(o);
            setEnrollments(enr);
            setStudents(studs);
            setPickStudent(studs[0]?.id ?? "");
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load");
            setOffering(null);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        void load();
    }, [load]);

    /* Lazy-fetch supplementary tabs on first selection */
    useEffect(() => {
        if (!offering) return;
        if (tab === "exams" && exams.length === 0) {
            void (async () => {
                try {
                    const all = await listExams(offering.academicYearId);
                    setExams(all.filter((x) => x.classOfferingId === offering.id));
                } catch (e) {
                    showToast(e instanceof Error ? e.message : "Failed to load exams", "danger");
                }
            })();
        }
        if (tab === "attendance" && !attendance) {
            void (async () => {
                try {
                    const r = await classAttendanceReport(offering.id);
                    setAttendance(r);
                } catch (e) {
                    showToast(
                        e instanceof Error ? e.message : "Failed to load attendance",
                        "danger",
                    );
                }
            })();
        }
        if (tab === "activity" && auditRows.length === 0) {
            void (async () => {
                try {
                    const all = (await listAuditLogs(200)) as AuditRow[];
                    setAuditRows(
                        all.filter(
                            (r) =>
                                r.entityId === offering.id ||
                                r.entityType.toLowerCase().includes("class"),
                        ),
                    );
                } catch (e) {
                    showToast(e instanceof Error ? e.message : "Failed to load activity", "danger");
                }
            })();
        }
    }, [tab, offering, exams.length, attendance, auditRows.length, showToast]);

    const enrolledIds = useMemo(
        () => new Set(enrollments.map((e) => e.studentId)),
        [enrollments],
    );
    const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

    const availableStudents = students.filter((s) => !enrolledIds.has(s.id));

    /* Derived stats from real data */
    const attendanceRate = useMemo(() => {
        if (!attendance || attendance.sessions.length === 0) return null;
        let present = 0;
        let total = 0;
        for (const s of attendance.sessions) {
            for (const m of s.marks) {
                total += 1;
                if (m.status === "present") present += 1;
            }
        }
        if (!total) return null;
        return Math.round((present / total) * 100);
    }, [attendance]);

    const addEnrollment = async () => {
        if (!offering || !pickStudent) return;
        try {
            await createEnrollment({
                studentId: pickStudent,
                classOfferingId: offering.id,
                academicYearId: offering.academicYearId,
            });
            await load();
            showToast("Student enrolled");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Enroll failed", "danger");
        }
    };

    const removeEnr = async (id: string) => {
        setRemovingId(id);
        try {
            await deleteEnrollment(id);
            await load();
            showToast("Enrollment removed");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Remove failed", "danger");
        } finally {
            setRemovingId(null);
            setRemoveTarget(null);
        }
    };

    if (loading) {
        return (
            <div className="kit-page" data-role="admin">
                <KitLoadingBlock label="Loading class…" />
            </div>
        );
    }

    if (err && !offering) {
        return (
            <div className="kit-page" data-role="admin">
                <button
                    type="button"
                    onClick={() => router.push("/admin/classes")}
                    className="btn-kit btn-kit-ghost"
                    style={{ marginBottom: 14, paddingLeft: 0 }}
                >
                    <Icon name="chev" size={11} className="-rotate-180" /> Back to classes
                </button>
                <KitErrorBanner message={err} />
            </div>
        );
    }

    if (!offering) return null;

    const subjectName =
        (offering as unknown as { subjectName?: string }).subjectName ??
        offering.displayName?.split(" · ")[0] ??
        offering.name ??
        "Class";
    const gradeName = (offering as unknown as { gradeName?: string }).gradeName ?? "";
    const sectionName = (offering as unknown as { sectionName?: string }).sectionName ?? "";

    const examsLive = exams.filter((e) => e.published).length;
    const upcomingExams = exams
        .filter((e) => new Date(e.opensAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.opensAt).getTime() - new Date(b.opensAt).getTime());

    const TABS: Array<[TabId, string, number?]> = [
        ["roster", "Roster", enrollments.length],
        ["exams", "Exams", exams.length],
        ["assignments", "Assignments"],
        ["attendance", "Attendance"],
        ["content", "Content"],
        ["activity", "Activity"],
    ];

    return (
        <div className="kit-page" data-role="admin">
            <button
                type="button"
                onClick={() => router.push("/admin/classes")}
                className="btn-kit btn-kit-ghost"
                style={{ marginBottom: 14, paddingLeft: 0 }}
            >
                <Icon name="chev" size={11} className="-rotate-180" /> Back to classes
            </button>

            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        {gradeName ? <Pill kind="neutral">{gradeName}</Pill> : null}
                        {sectionName ? <span>Section {sectionName}</span> : null}
                        <span className="dot-sep">·</span>
                        <span>
                            {enrollments.length} {enrollments.length === 1 ? "student" : "students"}
                        </span>
                    </>
                }
                title={subjectName}
                sub={offering.displayName?.trim() || offering.name?.trim() || "Class roster and enrollments."}
                actions={
                    <>
                        <Link
                            href={{
                                pathname: "/admin/announcements",
                                query: { classOfferingId: offering.id },
                            }}
                            className="btn-kit btn-kit-secondary"
                        >
                            <Icon name="megaphone" /> Broadcast
                        </Link>
                        <Link
                            href={{
                                pathname: "/admin/exams",
                                query: { classOfferingId: offering.id },
                            }}
                            className="btn-kit btn-kit-primary"
                        >
                            <Icon name="plus" /> New exam
                        </Link>
                    </>
                }
            />

            <StatGrid cols={4} style={{ marginBottom: 14 }}>
                <StatTile
                    icon="user"
                    label="Students"
                    value={`${enrollments.length}`}
                    note={`${availableStudents.length} unenrolled in pool`}
                />
                <StatTile
                    icon="paper"
                    label="Exams"
                    value={String(exams.length)}
                    note={`${examsLive} live · ${upcomingExams.length} upcoming`}
                />
                <StatTile
                    icon="check"
                    label="Attendance"
                    value={attendanceRate != null ? `${attendanceRate}%` : "—"}
                    note={
                        attendance && attendance.sessions.length > 0
                            ? `${attendance.sessions.length} ${
                                  attendance.sessions.length === 1 ? "session" : "sessions"
                              } logged`
                            : "open the tab to load"
                    }
                />
                <StatTile
                    icon="history"
                    label="Activity"
                    value={auditRows.length > 0 ? String(auditRows.length) : "—"}
                    note={auditRows.length > 0 ? "events on this class" : "open the tab to load"}
                />
            </StatGrid>

            {err ? <KitErrorBanner message={err} /> : null}

            <div
                className="k-tabs"
                style={{ borderBottom: "1px solid var(--hairline)", marginBottom: 14 }}
            >
                {TABS.map(([id, label, count]) => (
                    <button
                        key={id}
                        type="button"
                        className={`k-tab ${tab === id ? "active" : ""}`}
                        onClick={() => setTab(id)}
                    >
                        {label}
                        {count != null ? <span className="k-tab__count">{count}</span> : null}
                    </button>
                ))}
            </div>

            {tab === "roster" ? (
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Roster</div>
                            <div className="k-card__sub">
                                {enrollments.length} enrolled students
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                            <div style={{ minWidth: 240 }}>
                                <KField label="Add student">
                                    <KitSelect
                                        value={pickStudent}
                                        onChange={(e) => setPickStudent(e.target.value)}
                                        disabled={availableStudents.length === 0}
                                    >
                                        {availableStudents.length === 0 ? (
                                            <option value="">All students enrolled</option>
                                        ) : (
                                            availableStudents.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {fullName(s)} · {s.email}
                                                </option>
                                            ))
                                        )}
                                    </KitSelect>
                                </KField>
                            </div>
                            <button
                                type="button"
                                className="btn-kit btn-kit-primary"
                                onClick={addEnrollment}
                                disabled={!pickStudent || availableStudents.length === 0}
                                style={{ marginBottom: 0 }}
                            >
                                <Icon name="plus" /> Enroll
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="gtable">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            style={{
                                                color: "var(--ink-3)",
                                                padding: "20px 16px",
                                                textAlign: "center",
                                            }}
                                        >
                                            No enrollments yet — add students above.
                                        </td>
                                    </tr>
                                ) : (
                                    enrollments.map((e) => {
                                        const s = studentMap.get(e.studentId);
                                        return (
                                            <tr key={e.id}>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                        }}
                                                    >
                                                        <KAvatar initials={initialsFor(s)} />
                                                        <b>{fullName(s)}</b>
                                                    </div>
                                                </td>
                                                <td style={{ color: "var(--ink-3)", fontSize: 12.5 }}>
                                                    {s?.email ?? ""}
                                                </td>
                                                <td>
                                                    <Pill
                                                        kind={
                                                            e.status === "active"
                                                                ? "active"
                                                                : "neutral"
                                                        }
                                                    >
                                                        {e.status}
                                                    </Pill>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        type="button"
                                                        className="btn-kit btn-kit-danger-soft"
                                                        onClick={() => setRemoveTarget(e)}
                                                        disabled={removingId === e.id}
                                                        style={{ height: 26, padding: "0 8px" }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : tab === "exams" ? (
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Exams</div>
                            <div className="k-card__sub">
                                {exams.length} {exams.length === 1 ? "exam" : "exams"} ·{" "}
                                {examsLive} live
                            </div>
                        </div>
                        <Link
                            href={{
                                pathname: "/admin/exams",
                                query: { classOfferingId: offering.id },
                            }}
                            className="btn-kit btn-kit-primary"
                        >
                            <Icon name="plus" /> New exam
                        </Link>
                    </div>
                    {exams.length === 0 ? (
                        <KitEmpty
                            icon={<Icon name="paper" size={20} />}
                            title="No exams yet"
                            sub="Create a new exam from the exam builder, scoped to this class."
                        />
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="gtable">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Opens</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.map((e) => {
                                        const pill: { kind: PillKind; label: string } = e.published
                                            ? { kind: "active", label: "Published" }
                                            : { kind: "neutral", label: "Draft" };
                                        return (
                                            <tr key={e.id}>
                                                <td>
                                                    <b>{e.title}</b>
                                                </td>
                                                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                                                    {new Date(e.opensAt).toLocaleString()}
                                                </td>
                                                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                                                    {e.durationMinutes} min
                                                </td>
                                                <td>
                                                    <Pill kind={pill.kind}>{pill.label}</Pill>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : tab === "assignments" ? (
                <div className="k-card">
                    <KitEmpty
                        icon={<Icon name="file" size={20} />}
                        title="Assignments are teacher-scoped"
                        sub="Open the teacher portal to view and grade assignments for this class."
                        action={
                            <Link
                                href={`/teacher/classes/${offering.id}`}
                                className="btn-kit btn-kit-primary"
                            >
                                Open in teacher portal
                            </Link>
                        }
                    />
                </div>
            ) : tab === "attendance" ? (
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Attendance</div>
                            <div className="k-card__sub">
                                {attendance == null
                                    ? "Loading sessions…"
                                    : `${attendance.sessions.length} sessions${
                                          attendanceRate != null ? ` · ${attendanceRate}% present` : ""
                                      }`}
                            </div>
                        </div>
                        <Link href="/admin/attendance" className="btn-kit btn-kit-secondary">
                            Open attendance
                        </Link>
                    </div>
                    {attendance == null ? (
                        <KitLoadingBlock label="Loading attendance…" />
                    ) : attendance.sessions.length === 0 ? (
                        <KitEmpty
                            icon={<Icon name="check" size={20} />}
                            title="No attendance logged yet"
                            sub="Sessions taken from the Attendance page will appear here."
                        />
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="gtable">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Present</th>
                                        <th>Absent</th>
                                        <th>Late</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.sessions
                                        .slice()
                                        .reverse()
                                        .map((s) => {
                                            const counts = {
                                                present: 0,
                                                absent: 0,
                                                late: 0,
                                            };
                                            for (const m of s.marks) {
                                                if (m.status === "present") counts.present += 1;
                                                else if (m.status === "absent") counts.absent += 1;
                                                else if (m.status === "late") counts.late += 1;
                                            }
                                            return (
                                                <tr key={s.sessionId}>
                                                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                                                        {new Date(s.date).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <Pill kind="active">{counts.present}</Pill>
                                                    </td>
                                                    <td>
                                                        <Pill kind="danger">{counts.absent}</Pill>
                                                    </td>
                                                    <td>
                                                        <Pill kind="pending">{counts.late}</Pill>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : tab === "content" ? (
                <div className="k-card">
                    <KitEmpty
                        icon={<Icon name="library" size={20} />}
                        title="Content is teacher-scoped"
                        sub="Open the teacher portal to view and publish learning materials for this class."
                        action={
                            <Link
                                href={`/teacher/classes/${offering.id}`}
                                className="btn-kit btn-kit-primary"
                            >
                                Open in teacher portal
                            </Link>
                        }
                    />
                </div>
            ) : tab === "activity" ? (
                <div className="k-card">
                    <div className="k-card__head">
                        <div>
                            <div className="k-card__title">Activity</div>
                            <div className="k-card__sub">
                                Last {auditRows.length} events touching this class
                            </div>
                        </div>
                    </div>
                    {auditRows.length === 0 ? (
                        <KitEmpty
                            icon={<Icon name="history" size={20} />}
                            title="No activity yet"
                            sub="Class-related admin actions will appear here as they happen."
                        />
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="gtable">
                                <thead>
                                    <tr>
                                        <th>When</th>
                                        <th>Action</th>
                                        <th>Entity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditRows.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                                                {relTime(r.createdAt)}
                                            </td>
                                            <td>
                                                <b>{r.action}</b>
                                            </td>
                                            <td style={{ color: "var(--ink-3)", fontSize: 12.5 }}>
                                                {r.entityType}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}

            {removeTarget && (
                <KitDialog
                    title="Remove enrollment"
                    onClose={() => setRemoveTarget(null)}
                    maxWidth={380}
                    footer={
                        <>
                            <button
                                type="button"
                                className="btn-kit btn-kit-ghost"
                                onClick={() => setRemoveTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-kit btn-kit-danger"
                                onClick={() => void removeEnr(removeTarget.id)}
                                disabled={removingId != null}
                            >
                                {removingId === removeTarget.id ? (
                                    <KitSpinner size={12} />
                                ) : (
                                    "Remove"
                                )}
                            </button>
                        </>
                    }
                >
                    <div style={{ fontSize: 13, color: "var(--ink)" }}>
                        Remove <b>{fullName(studentMap.get(removeTarget.studentId))}</b> from this
                        class? This will not delete the student account.
                    </div>
                </KitDialog>
            )}

            {toast && <KitToast message={toast.msg} tone={toast.tone} />}
        </div>
    );
}
