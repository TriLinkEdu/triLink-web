"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Icon,
  KField,
  KitErrorBanner,
  KitInput,
  KitSegmented,
  KitSelect,
  PageHead as KitPageHead,
  StatGrid as KitStatGrid,
  StatTile as KitStatTile,
} from "@/components/kit";
import {
  type AttendanceMark,
  type AttendanceSession,
  type AcademicYear,
  type ClassOffering,
  type Enrollment,
  type PublicUser,
  classAttendanceReport,
  createAttendanceSession,
  getSessionMarks,
  listAttendanceSessions,
  listAcademicYears,
  listClassOfferings,
  listEnrollments,
  listUsers,
  putSessionMarks,
} from "@/lib/admin-api";
import { KitSkeleton } from "@/components/kit/local";

function AttendanceSkeleton() {
  return (
    <div className="kit-page" data-role="admin">
      <style>{`@keyframes kit-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ marginBottom: 18 }}>
        <KitSkeleton width={140} height={11} style={{ marginBottom: 10 }} />
        <KitSkeleton width="60%" height={26} style={{ marginBottom: 8 }} />
        <KitSkeleton width="40%" height={13} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="k-card" key={i} style={{ padding: 14 }}>
            <KitSkeleton width={22} height={22} radius={5} style={{ marginBottom: 10 }} />
            <KitSkeleton width="60%" height={10} style={{ marginBottom: 6 }} />
            <KitSkeleton width="38%" height={18} />
          </div>
        ))}
      </div>
      <div className="k-card" style={{ padding: 16 }}>
        <KitSkeleton width="100%" height={240} radius={8} />
      </div>
    </div>
  );
}

export default function AdminAttendance() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [classId, setClassId] = useState("");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [marks, setMarks] = useState<AttendanceMark[]>([]);
  const [enrolled, setEnrolled] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [report, setReport] = useState<Awaited<ReturnType<typeof classAttendanceReport>> | null>(null);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const loadOfferings = useCallback(async (y: string) => {
    if (!y) {
      setOfferings([]);
      return;
    }
    setOfferings(await listClassOfferings(y));
  }, []);

  const loadClassData = useCallback(async (cid: string) => {
    const [sess, enr, rep] = await Promise.all([
      listAttendanceSessions(cid),
      listEnrollments({ classOfferingId: cid }),
      classAttendanceReport(cid),
    ]);
    setSessions(sess);
    setEnrolled(enr);
    setReport(rep);
    const first = sess[0]?.id ?? "";
    setSessionId(first);
    if (first) setMarks(await getSessionMarks(first));
    else setMarks([]);
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const ylist = await listAcademicYears();
        if (c) return;
        setYears(ylist);
        const active = ylist.find((x) => x.isActive && !x.isArchived);
        const y = active?.id ?? ylist[0]?.id ?? "";
        setYearId(y);
        if (y) await loadOfferings(y);
        setStudents(await listUsers("student"));
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Init failed");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [loadOfferings]);

  useEffect(() => {
    if (!classId) {
      setSessions([]);
      setSessionId("");
      setMarks([]);
      setEnrolled([]);
      setReport(null);
      return;
    }
    let c = false;
    (async () => {
      try {
        const [sess, enr, rep] = await Promise.all([
          listAttendanceSessions(classId),
          listEnrollments({ classOfferingId: classId }),
          classAttendanceReport(classId),
        ]);
        if (c) return;
        setSessions(sess);
        setEnrolled(enr);
        setReport(rep);
        const first = sess[0]?.id ?? "";
        setSessionId(first);
        if (first) setMarks(await getSessionMarks(first));
        else setMarks([]);
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Load class failed");
      }
    })();
    return () => {
      c = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!sessionId) {
      setMarks([]);
      return;
    }
    let c = false;
    (async () => {
      try {
        const m = await getSessionMarks(sessionId);
        if (!c) setMarks(m);
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Marks failed");
      }
    })();
    return () => {
      c = true;
    };
  }, [sessionId]);

  const createSession = async () => {
    if (!classId || !newDate) return;
    try {
      await createAttendanceSession({ classOfferingId: classId, date: newDate });
      await loadClassData(classId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create session failed");
    }
  };

  const markForStudent = (studentId: string) => marks.find((m) => m.studentId === studentId)?.status ?? "";

  const saveMarks = async () => {
    if (!sessionId || !enrolled.length) return;
    // Only persist students who have an actual mark; treat "unmarked" as absent
    // server-side so the existing backend schema (which has no "unmarked"
    // status) keeps working without a migration.
    const payload = enrolled.map((e) => {
      const local = markForStudent(e.studentId);
      return {
        studentId: e.studentId,
        status: local && local !== "unmarked" ? local : "absent",
      };
    });
    try {
      await putSessionMarks(sessionId, payload);
      setMarks(await getSessionMarks(sessionId));
      if (classId) setReport(await classAttendanceReport(classId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save marks failed");
    }
  };

  const updateLocalMark = (studentId: string, status: string) => {
    setMarks((prev) => {
      const other = prev.filter((m) => m.studentId !== studentId);
      return [...other, { id: "local", sessionId, studentId, status } as AttendanceMark];
    });
  };

  const activeYearLabel = years.find((y) => y.id === yearId)?.label ?? "None";
  const presentCount = marks.filter((m) => m.status === "present").length;
  const totalCount = enrolled.length;
  const presentRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (loading && years.length === 0) {
    return <AttendanceSkeleton />;
  }

  const STATUS_OPTIONS = [
    { value: "unmarked", label: "Unmarked" },
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
    { value: "excused", label: "Excused" },
  ] as const;

  return (
    <div className="kit-page" data-role="admin">
      <KitPageHead
        meta={
          <>
            <span className="role-dot" />
            Daily tracking
            <span className="dot-sep">·</span>
            {activeYearLabel}
          </>
        }
        title="Attendance"
        sub="Take attendance by class and date with fast status updates."
      />
      {err && <KitErrorBanner message={err} />}

      <KitStatGrid cols={4} className="!mb-[14px]">
        <KitStatTile icon="cal" label="Academic year" value={activeYearLabel || "—"} note="selected scope" />
        <KitStatTile icon="check" label="Sessions" value={String(sessions.length)} note="for selected class" />
        <KitStatTile icon="users" label="Enrolled" value={String(enrolled.length)} note="class roster" />
        <KitStatTile icon="sparkles" label="Present rate" value={`${presentRate}%`} note="current session" />
      </KitStatGrid>

      {/* Scope picker */}
      <div className="k-card" style={{ marginBottom: 14 }}>
        <div className="k-card__head">
          <div className="k-card__title">Scope</div>
          <div className="k-card__sub">Pick a year and class to load its sessions and roster.</div>
        </div>
        <div
          className="k-card__body"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 10,
            maxWidth: 560,
          }}
        >
          <KField label="Academic year">
            <KitSelect
              value={yearId}
              onChange={(e) => {
                const v = e.target.value;
                setYearId(v);
                loadOfferings(v);
                setClassId("");
              }}
            >
              {years.length === 0 && <option value="">No years</option>}
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                  {y.isActive ? " · active" : ""}
                </option>
              ))}
            </KitSelect>
          </KField>
          <KField label="Class offering">
            <KitSelect value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select…</option>
              {offerings.map((o) => {
                const title =
                  o.displayName?.trim() ||
                  o.name?.trim() ||
                  [o.gradeName, o.sectionName].filter(Boolean).join(" ") ||
                  "Class";
                return (
                  <option key={o.id} value={o.id}>
                    {title}
                  </option>
                );
              })}
            </KitSelect>
          </KField>
        </div>
      </div>

      {report && (
        <div className="k-card" style={{ marginBottom: 14 }}>
          <div
            className="k-card__head"
            style={{ alignItems: "center" }}
          >
            <div>
              <div className="k-card__title">Class report</div>
              <div className="k-card__sub">
                {report.sessions.length} session{report.sessions.length === 1 ? "" : "s"} recorded.
              </div>
            </div>
            <button
              type="button"
              className="btn-kit btn-kit-ghost"
              onClick={() => classId && loadClassData(classId)}
            >
              <Icon name="refresh" /> Refresh
            </button>
          </div>
        </div>
      )}

      {classId && (
        <div className="k-card">
          <div className="k-card__head">
            <div className="k-card__title">Sessions &amp; marks</div>
            <div className="k-card__sub">Create a session and mark each student.</div>
          </div>
          <div className="k-card__body" style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
                gap: 10,
                alignItems: "end",
              }}
            >
              <KField label="New session date">
                <KitInput
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </KField>
              <KField label="Existing session">
                <KitSelect
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                >
                  {sessions.length === 0 && <option value="">No sessions</option>}
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date}
                    </option>
                  ))}
                </KitSelect>
              </KField>
              <button
                type="button"
                className="btn-kit btn-kit-primary"
                onClick={createSession}
                disabled={!newDate}
                style={{ height: 32 }}
              >
                <Icon name="plus" /> Create session
              </button>
            </div>

            {sessionId && enrolled.length > 0 && (
              <>
                <div className="k-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="gtable">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th style={{ width: "50%" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolled.map((e) => {
                        const st = studentMap.get(e.studentId);
                        const cur = (markForStudent(e.studentId) || "unmarked") as
                          | "unmarked"
                          | "present"
                          | "late"
                          | "absent"
                          | "excused";
                        return (
                          <tr key={e.studentId}>
                            <td style={{ fontWeight: 500, color: "var(--ink)" }}>
                              {st ? `${st.firstName} ${st.lastName}` : e.studentId}
                            </td>
                            <td>
                              <KitSegmented
                                options={STATUS_OPTIONS}
                                value={cur}
                                onChange={(v) => updateLocalMark(e.studentId, v)}
                                size="sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div>
                  <button
                    type="button"
                    className="btn-kit btn-kit-primary"
                    onClick={saveMarks}
                  >
                    <Icon name="check" /> Save marks
                  </button>
                </div>
              </>
            )}
            {sessionId && enrolled.length === 0 && (
              <div
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  border: "1px dashed var(--color-hairline)",
                  borderRadius: 8,
                  background: "var(--color-surface-2)",
                  fontSize: 12.5,
                  color: "var(--ink-3)",
                }}
              >
                No enrollments in this class — add students from the class detail page.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
