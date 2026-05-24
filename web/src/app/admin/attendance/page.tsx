"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarDays, ClipboardCheck, RefreshCcw, Sparkles, Users } from "lucide-react";
import Select from "@/components/Select";
import TablePagination from "@/components/TablePagination";
import {
  type AttendanceMark,
  type AttendanceSession,
  type AcademicYear,
  type ClassOffering,
  type Enrollment,
  type PublicUser,
  classAttendanceReport,
  getSessionMarks,
  listAttendanceSessions,
  listAcademicYears,
  listClassOfferings,
  listEnrollments,
  listUsers,
  putSessionMarks,
} from "@/lib/admin-api";
import { PageHeader, PageHeaderSkeleton, StatGridSkeleton, TableSkeleton } from "@/components/ui";

const STATUSES = ["present", "absent", "excused"];
const ROWS_OPTIONS = [5, 10, 20, 50];

function AttendanceSkeleton() {
  return (
    <div className="page-wrapper">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <TableSkeleton rows={6} columns={4} />
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
  const [savedMarks, setSavedMarks] = useState<AttendanceMark[]>([]); // last-known server state
  const [enrolled, setEnrolled] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [report, setReport] = useState<Awaited<ReturnType<typeof classAttendanceReport>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClass, setLoadingClass] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const loadOfferings = useCallback(async (y: string) => {
    if (!y) {
      setOfferings([]);
      return;
    }
    setLoadingOfferings(true);
    try {
      setOfferings(await listClassOfferings(y));
    } finally {
      setLoadingOfferings(false);
    }
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
    // Don't fetch marks here — the sessionId useEffect handles that
    setSessionId(sess[0]?.id ?? "");
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
      setSavedMarks([]);
      setEnrolled([]);
      setReport(null);
      return;
    }
    let c = false;
    setLoadingClass(true);
    setMarks([]);       // clear stale marks immediately
    setSavedMarks([]);
    setSessionId("");   // clear stale session immediately
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
        // Set first session — the sessionId useEffect will fetch its marks
        setSessionId(sess[0]?.id ?? "");
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Load class failed");
      } finally {
        if (!c) setLoadingClass(false);
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
    setMarks([]);         // clear stale marks immediately so old session doesn't show
    setSavedMarks([]);
    setLoadingMarks(true);
    (async () => {
      try {
        const m = await getSessionMarks(sessionId);
        if (!c) {
          setMarks(m);
          setSavedMarks(m);
        }
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Marks failed");
      } finally {
        if (!c) setLoadingMarks(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [sessionId]);

  // Reset pagination when session or rows change
  useEffect(() => { setCurrentPage(1); }, [sessionId, rowsPerPage]);

  const markForStudent = (studentId: string) => marks.find((m) => m.studentId === studentId)?.status ?? "";

  const saveMarks = async () => {
    if (!sessionId || !enrolled.length || savingMarks) return;
    const payload = enrolled.map((e) => ({
      studentId: e.studentId,
      status: markForStudent(e.studentId) || "absent",
    }));
    setSavingMarks(true);
    setSaveSuccess(false);
    setErr(null);
    try {
      await putSessionMarks(sessionId, payload);
      // Reload marks and report with loading state visible
      const [freshMarks, freshReport] = await Promise.all([
        getSessionMarks(sessionId),
        classId ? classAttendanceReport(classId) : Promise.resolve(null),
      ]);
      setMarks(freshMarks);
      if (freshReport) setReport(freshReport);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save marks failed");
    } finally {
      setSavingMarks(false);
    }
  };

  const updateLocalMark = (studentId: string, status: string) => {
    setMarks((prev) => {
      const other = prev.filter((m) => m.studentId !== studentId);
      return [...other, { id: "local", sessionId, studentId, status } as AttendanceMark];
    });
  };

  const activeYear = years.find((y) => y.id === yearId);

  // Summary stats — based on ALL sessions in the report (not just the selected session)
  const totalSessions = report?.sessions.length ?? 0;
  const totalEnrolled = enrolled.length;

  const { totalPresent, totalMarks } = useMemo(() => {
    if (!report) return { totalPresent: 0, totalMarks: 0 };
    let present = 0;
    let total = 0;
    for (const s of report.sessions) {
      for (const m of s.marks) {
        total++;
        if (m.status === "present") present++;
      }
    }
    return { totalPresent: present, totalMarks: total };
  }, [report]);

  const overallPresentRate = totalMarks > 0 ? Math.round((totalPresent / totalMarks) * 100) : 0;

  // Current session snapshot (for the marks table)
  const presentCount = marks.filter((m) => m.status === "present").length;
  const totalCount = enrolled.length;
  const presentRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Cascade filter state
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Derive unique grades / sections / subjects from offerings
  const gradeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    offerings.forEach(o => { if (o.gradeName) seen.set(o.gradeId, o.gradeName); });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [offerings]);

  const sectionOptions = useMemo(() => {
    const seen = new Map<string, string>();
    offerings
      .filter(o => !filterGrade || o.gradeId === filterGrade)
      .forEach(o => { if (o.sectionName) seen.set(o.sectionId, o.sectionName); });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [offerings, filterGrade]);

  const subjectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    offerings
      .filter(o => (!filterGrade || o.gradeId === filterGrade) && (!filterSection || o.sectionId === filterSection))
      .forEach(o => { if (o.subjectName) seen.set(o.subjectId, o.subjectName); });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [offerings, filterGrade, filterSection]);

  const filteredOfferings = useMemo(() =>
    offerings.filter(o =>
      (!filterGrade || o.gradeId === filterGrade) &&
      (!filterSection || o.sectionId === filterSection) &&
      (!filterSubject || o.subjectId === filterSubject)
    ),
  [offerings, filterGrade, filterSection, filterSubject]);

  // Pagination helpers
  const pagedEnrolled = enrolled.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading && years.length === 0) {
    return <AttendanceSkeleton />;
  }

  const statusColor = (status: string) => {
    if (status === "present") return { bg: "var(--success-light)", color: "#065f46" };
    if (status === "absent")  return { bg: "var(--danger-light)",  color: "#991b1b" };
    if (status === "excused") return { bg: "var(--warning-light)", color: "#92400e" };
    return { bg: "var(--gray-100)", color: "var(--gray-600)" };
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        kicker="Daily Tracking"
        title="Attendance"
        subtitle="View and edit attendance records by class and session."
        icon={<ClipboardCheck size={22} />}
      />
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}

      {/* ── Stat cards ── */}
      <div className="stats-grid admin-dash-stats-grid">

        {/* Academic Year — rich card */}
        <div className="stat-card admin-dash-stat-card" style={{ gridColumn: "span 1", position: "relative", overflow: "hidden" }}>
          {/* decorative gradient blob */}
          <div style={{
            position: "absolute", top: -18, right: -18,
            width: 80, height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary-200), var(--primary-400))",
            opacity: 0.18,
            pointerEvents: "none",
          }} />
          <div className="stat-icon admin-dash-stat-icon blue">
            <CalendarDays size={20} />
          </div>
          <div className="stat-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-label admin-dash-stat-label">Academic Year</div>
            <div
              className="stat-value"
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--primary-800)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
              title={activeYear?.label ?? "None"}
            >
              {activeYear?.label ?? "None"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
              {activeYear?.isActive && !activeYear?.isArchived && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "var(--radius-full)",
                  background: "var(--success-light)",
                  color: "#065f46",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                  Active
                </span>
              )}
              {activeYear?.isArchived && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "var(--radius-full)",
                  background: "var(--gray-100)",
                  color: "var(--gray-500)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}>
                  Archived
                </span>
              )}
              <span className="admin-dash-stat-note" style={{ margin: 0 }}>Selected scope</span>
            </div>
          </div>
        </div>

        <div className="stat-card admin-dash-stat-card">
          <div className="stat-icon admin-dash-stat-icon teal">
            <ClipboardCheck size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label admin-dash-stat-label">Total sessions</div>
            <div className="stat-value">{totalSessions}</div>
            <div className="admin-dash-stat-note">
              {filterGrade ? `${gradeOptions.find(g => g.id === filterGrade)?.name ?? ""}${filterSection ? ` · ${sectionOptions.find(s => s.id === filterSection)?.name ?? ""}` : ""}` : "All classes"}
            </div>
          </div>
        </div>

        <div className="stat-card admin-dash-stat-card">
          <div className="stat-icon admin-dash-stat-icon orange">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label admin-dash-stat-label">Enrolled students</div>
            <div className="stat-value">{totalEnrolled}</div>
            <div className="admin-dash-stat-note">Class roster size</div>
          </div>
        </div>

        <div className="stat-card admin-dash-stat-card">
          <div className="stat-icon admin-dash-stat-icon purple">
            <CalendarCheck2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label admin-dash-stat-label">Overall present rate</div>
            <div className="stat-value">{classId ? `${overallPresentRate}%` : "—"}</div>
            <div className="admin-dash-stat-note">Across all sessions</div>
          </div>
        </div>
      </div>

      {/* ── Filters card ── */}
      <div className="card attendance-panel" style={{ marginBottom: "1rem", display: "grid", gap: "0.75rem", maxWidth: 520, position: "relative", zIndex: 100, overflow: "visible" }}>
        <label>
          Academic year
          <Select
            value={yearId}
            onChange={(e) => {
              const v = e.target.value;
              setYearId(v);
              loadOfferings(v);
              setClassId("");
              setFilterGrade("");
              setFilterSection("");
              setFilterSubject("");
            }}
            style={{ display: "block", marginTop: 4, padding: "0.65rem 1rem", borderRadius: "20px", border: "1.5px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: "pointer", fontWeight: 600 }}
          >
            {years.length === 0 && <option value="">No years</option>}
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}{y.isActive ? " ★" : ""}
              </option>
            ))}
          </Select>
        </label>

        {/* Grade filter */}
        <label>
          Grade
          <Select
            value={filterGrade}
            onChange={(e) => { setFilterGrade(e.target.value); setFilterSection(""); setFilterSubject(""); setClassId(""); }}
            disabled={loadingOfferings}
            style={{ display: "block", marginTop: 4, padding: "0.65rem 1rem", borderRadius: "20px", border: "1.5px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: loadingOfferings ? "not-allowed" : "pointer", fontWeight: 600 }}
          >
            {loadingOfferings ? (
              <option value="">Loading grades…</option>
            ) : (
              <>
                <option value="">All grades</option>
                {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </>
            )}
          </Select>
        </label>

        {/* Section filter */}
        <label>
          Section
          <Select
            value={filterSection}
            onChange={(e) => { setFilterSection(e.target.value); setFilterSubject(""); setClassId(""); }}
            disabled={!filterGrade}
            style={{ display: "block", marginTop: 4, padding: "0.65rem 1rem", borderRadius: "20px", border: "1.5px solid var(--primary-200)", background: filterGrade ? "var(--primary-50)" : "var(--gray-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: filterGrade ? "pointer" : "not-allowed", fontWeight: 600 }}
          >
            <option value="">All sections</option>
            {sectionOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </label>

        {/* Subject filter */}
        <label>
          Subject
          <Select
            value={filterSubject}
            onChange={(e) => { setFilterSubject(e.target.value); setClassId(""); }}
            disabled={!filterSection}
            style={{ display: "block", marginTop: 4, padding: "0.65rem 1rem", borderRadius: "20px", border: "1.5px solid var(--primary-200)", background: filterSection ? "var(--primary-50)" : "var(--gray-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: filterSection ? "pointer" : "not-allowed", fontWeight: 600 }}
          >
            <option value="">All subjects</option>
            {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </label>

        {/* Class offering — filtered */}
        <label>
          Class offering
          <Select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            style={{ display: "block", marginTop: 4, padding: "0.65rem 1rem", borderRadius: "20px", border: "1.5px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", width: "100%", outline: "none", cursor: "pointer", fontWeight: 600 }}
          >
            <option value="">Select…</option>
            {filteredOfferings.map((o) => {
              const grade = (o.gradeName ?? "").trim();
              const section = (o.sectionName ?? "").trim();
              const subject = (o.subjectName ?? o.displayName ?? o.name ?? "Class").trim();
              const label = [grade, section, subject].filter(Boolean).join(" · ");
              return <option key={o.id} value={o.id}>{label || o.id}</option>;
            })}
          </Select>
        </label>
      </div>

      {report && (
        <div className="card attendance-panel" style={{ marginBottom: "1rem" }}>
          <div className="attendance-panel-head">
            <h3 className="card-title attendance-section-title">Class report</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
              onClick={async () => {
                if (!classId || refreshing) return;
                setRefreshing(true);
                try {
                  await loadClassData(classId);
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              <RefreshCcw size={13} style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none" }} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>{report.sessions.length} session(s)</p>
        </div>
      )}

      {!classId && (
        <div className="card attendance-panel" style={{ color: "var(--gray-500)", padding: "2rem", textAlign: "center" }}>
          Select a class offering above to view sessions and take attendance.
        </div>
      )}

      {classId && (
        <div className="card attendance-panel">
          <h3 className="card-title attendance-section-title" style={{ marginBottom: "0.75rem" }}>
            Sessions &amp; marks
          </h3>
          {loadingClass ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "2rem 0", color: "var(--gray-600)" }}>
              <div className="spinner" style={{ width: 20, height: 20, border: "2px solid var(--gray-300)", borderTopColor: "var(--primary-500)", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ color: "var(--gray-500)", padding: "1rem 0" }}>No sessions recorded for this class yet.</p>
          ) : (
            <>
              <Select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                style={{
                  padding: "0.65rem 1rem",
                  minWidth: 280,
                  marginBottom: "1rem",
                  borderRadius: "20px",
                  border: "1.5px solid var(--primary-200)",
                  background: "var(--primary-50)",
                  color: "var(--primary-800)",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date}
                  </option>
                ))}
              </Select>

              {sessionId && enrolled.length > 0 && (
                <>
                  {loadingMarks ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.5rem 0", color: "var(--gray-600)" }}>
                      <div className="spinner" style={{ width: 18, height: 18, border: "2px solid var(--gray-300)", borderTopColor: "var(--primary-500)", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
                      Loading marks for this session…
                    </div>
                  ) : (
                    <>
                      {/* ── Table toolbar ── */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                      }}>
                        {/* Session mini-stats */}
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {[
                            { label: "Present", count: marks.filter(m => m.status === "present").length, bg: "var(--success-light)", color: "#065f46" },
                            { label: "Absent",  count: marks.filter(m => m.status === "absent").length,  bg: "var(--danger-light)",  color: "#991b1b" },
                            { label: "Excused", count: marks.filter(m => m.status === "excused").length, bg: "var(--warning-light)", color: "#92400e" },
                          ].map(({ label, count, bg, color }) => (
                            <span key={label} style={{
                              display: "inline-flex", alignItems: "center", gap: "0.3rem",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "var(--radius-full)",
                              background: bg, color,
                              fontSize: "0.75rem", fontWeight: 700,
                            }}>
                              {label} <strong>{count}</strong>
                            </span>
                          ))}
                        </div>

                      </div>

                      <div style={{ position: "relative" }}>
                        {savingMarks && (
                          <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(255,255,255,0.75)",
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 8,
                            gap: "0.6rem",
                            fontWeight: 600,
                            color: "var(--primary-700)",
                            fontSize: "0.9rem",
                          }}>
                            <div style={{ width: 18, height: 18, border: "2.5px solid var(--primary-200)", borderTopColor: "var(--primary-500)", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
                            Saving marks…
                          </div>
                        )}
                        <div className="table-wrapper">
                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th>Student</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedEnrolled.map((e, idx) => {
                                const st = studentMap.get(e.studentId);
                                const cur = markForStudent(e.studentId) || "absent";
                                const { bg, color } = statusColor(cur);
                                const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                                return (
                                  <tr key={e.studentId}>
                                    <td style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "0.78rem" }}>{rowNum}</td>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        {/* Initials avatar */}
                                        <div style={{
                                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                                          background: "linear-gradient(135deg, var(--primary-500), var(--primary-700))",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          color: "#fff", fontSize: "0.65rem", fontWeight: 700,
                                        }}>
                                          {st ? `${st.firstName[0]}${st.lastName[0]}`.toUpperCase() : "??"}
                                        </div>
                                        <span style={{ fontWeight: 500 }}>
                                          {st ? `${st.firstName} ${st.lastName}` : e.studentId}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        <span style={{
                                          display: "inline-block",
                                          padding: "0.2rem 0.6rem",
                                          borderRadius: "var(--radius-full)",
                                          background: bg, color,
                                          fontSize: "0.72rem", fontWeight: 700,
                                          minWidth: 58, textAlign: "center",
                                          textTransform: "capitalize",
                                          pointerEvents: "none",
                                          userSelect: "none",
                                        }}>
                                          {cur}
                                        </span>
                                        <Select
                                          value={cur}
                                          onChange={(ev) => updateLocalMark(e.studentId, ev.target.value)}
                                          disabled={savingMarks}
                                          style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
                                        >
                                          {STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </Select>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <TablePagination
                        total={enrolled.length}
                        page={currentPage - 1}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPageChange={(newPage) => setCurrentPage(newPage + 1)}
                        onRowsPerPageChange={(newRowsPerPage) => {
                          setRowsPerPage(newRowsPerPage);
                          setCurrentPage(1);
                        }}
                      />

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                        onClick={saveMarks}
                        disabled={savingMarks}
                      >
                        {savingMarks ? (
                          <>
                            <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                            Saving…
                          </>
                        ) : saveSuccess ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Saved!
                          </>
                        ) : "Save marks"}
                      </button>
                    </>
                  )}
                </>
              )}
              {sessionId && enrolled.length === 0 && (
                <p style={{ color: "var(--gray-500)" }}>No enrollments in this class — add students from the class detail page.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
