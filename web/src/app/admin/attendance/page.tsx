"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck2, CalendarDays, ClipboardCheck, RefreshCcw, Sparkles, Users } from "lucide-react";
import Select from "@/components/Select";
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

const STATUSES = ["present", "absent", "excused"];

function AttendanceSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="attendance-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div className="admin-skeleton shimmer" style={{ width: 150, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "82%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "65%", height: 14 }} />
        </div>
      </div>
      <div className="attendance-summary-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="card attendance-summary-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "55%", height: 12, marginBottom: 8 }} />
            <div className="admin-skeleton shimmer" style={{ width: "35%", height: 22 }} />
          </div>
        ))}
      </div>
      <div className="card admin-dash-skeleton-block">
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 270, borderRadius: 12 }} />
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
    const payload = enrolled.map((e) => ({
      studentId: e.studentId,
      status: markForStudent(e.studentId) || "absent",
    }));
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

  return (
    <div className="page-wrapper">
      <div className="attendance-hero">
        <div>
          <p className="attendance-kicker">
            <Sparkles size={14} />
            Daily Tracking
          </p>
          <h1 className="attendance-title">Attendance</h1>
          <p className="attendance-subtitle">Take attendance by class and date with fast status updates</p>
        </div>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}

      <div className="attendance-summary-grid">
        <div className="card attendance-summary-card">
          <div className="attendance-summary-icon blue">
            <CalendarDays size={18} />
          </div>
          <div className="attendance-summary-label">Academic year</div>
          <div className="attendance-summary-value attendance-summary-small">{activeYearLabel}</div>
          <div className="attendance-summary-note">Selected scope</div>
        </div>
        <div className="card attendance-summary-card">
          <div className="attendance-summary-icon teal">
            <ClipboardCheck size={18} />
          </div>
          <div className="attendance-summary-label">Sessions</div>
          <div className="attendance-summary-value">{sessions.length}</div>
          <div className="attendance-summary-note">For selected class</div>
        </div>
        <div className="card attendance-summary-card">
          <div className="attendance-summary-icon orange">
            <Users size={18} />
          </div>
          <div className="attendance-summary-label">Enrolled students</div>
          <div className="attendance-summary-value">{enrolled.length}</div>
          <div className="attendance-summary-note">Class roster size</div>
        </div>
        <div className="card attendance-summary-card">
          <div className="attendance-summary-icon purple">
            <CalendarCheck2 size={18} />
          </div>
          <div className="attendance-summary-label">Present rate</div>
          <div className="attendance-summary-value">{presentRate}%</div>
          <div className="attendance-summary-note">Current session snapshot</div>
        </div>
      </div>

      <div className="card attendance-panel" style={{ marginBottom: "1rem", display: "grid", gap: "0.75rem", maxWidth: 520 }}>
        <label>
          Academic year
          <Select
            value={yearId}
            onChange={(e) => {
              const v = e.target.value;
              setYearId(v);
              loadOfferings(v);
              setClassId("");
            }}
            style={{ display: "block", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: "pointer", fontWeight: 500 }}
          >
            {years.length === 0 && <option value="">No years</option>}
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isActive ? " ★" : ""}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Class offering
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ display: "block", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "10px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: "pointer", fontWeight: 500 }}>
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
          </Select>
        </label>
      </div>

      {report && (
        <div className="card attendance-panel" style={{ marginBottom: "1rem" }}>
          <div className="attendance-panel-head">
            <h3 className="card-title attendance-section-title">Class report</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => classId && loadClassData(classId)}>
              <RefreshCcw size={13} />
              Refresh
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>{report.sessions.length} session(s)</p>
        </div>
      )}

      {classId && (
        <div className="card attendance-panel">
          <h3 className="card-title attendance-section-title" style={{ marginBottom: "0.75rem" }}>
            Sessions & marks
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={createSession}>
              Create session
            </button>
          </div>
          <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)} style={{ padding: "0.5rem", minWidth: 280, marginBottom: "1rem" }}>
            {sessions.length === 0 && <option value="">No sessions</option>}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.date}
              </option>
            ))}
          </Select>

          {sessionId && enrolled.length > 0 && (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map((e) => {
                      const st = studentMap.get(e.studentId);
                      const cur = markForStudent(e.studentId) || "absent";
                      return (
                        <tr key={e.studentId}>
                          <td>{st ? `${st.firstName} ${st.lastName}` : e.studentId}</td>
                          <td>
                            <Select value={cur} onChange={(ev) => updateLocalMark(e.studentId, ev.target.value)} style={{ padding: "0.35rem" }}>
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={saveMarks}>
                Save marks
              </button>
            </>
          )}
          {sessionId && enrolled.length === 0 && <p style={{ color: "var(--gray-500)" }}>No enrollments in this class — add students from the class detail page.</p>}
        </div>
      )}
    </div>
  );
}
