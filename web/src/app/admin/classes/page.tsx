"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, GraduationCap, RefreshCcw, Sparkles, UserRoundCheck } from "lucide-react";
import {
  type AcademicYear,
  type ClassOffering,
  type Grade,
  type PublicUser,
  type Section,
  type Subject,
  activateAcademicYear,
  createClassOffering,
  deleteClassOffering,
  listAcademicYears,
  listClassOfferings,
  listGrades,
  listSections,
  listSubjects,
  listUsers,
  patchClassOffering,
} from "@/lib/admin-api";

function labelOffering(
  o: ClassOffering,
  g: Map<string, Grade>,
  sec: Map<string, Section>,
  sub: Map<string, Subject>,
): string {
  if (o.name?.trim()) return o.name.trim();
  const gn = g.get(o.gradeId)?.name ?? o.gradeId.slice(0, 8);
  const sn = sec.get(o.sectionId)?.name ?? o.sectionId.slice(0, 8);
  const sb = sub.get(o.subjectId)?.name ?? o.subjectId.slice(0, 8);
  return `${gn} · ${sn} · ${sb}`;
}

function ClassesSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="classes-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div className="admin-skeleton shimmer" style={{ width: 160, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "85%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "70%", height: 14 }} />
        </div>
        <div className="admin-skeleton shimmer" style={{ width: 132, height: 38, borderRadius: 999 }} />
      </div>
      <div className="classes-summary-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="card classes-summary-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "55%", height: 12, marginBottom: 8 }} />
            <div className="admin-skeleton shimmer" style={{ width: "35%", height: 22 }} />
          </div>
        ))}
      </div>
      <div className="card admin-dash-skeleton-block" style={{ marginBottom: "1rem" }}>
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 86, borderRadius: 12 }} />
      </div>
      <div className="card admin-dash-skeleton-block">
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 260, borderRadius: 12 }} />
      </div>
    </div>
  );
}

export default function AdminClasses() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState<string>("");
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    gradeId: "",
    sectionId: "",
    subjectId: "",
    teacherId: "",
    name: "",
  });
  const [editTeacherId, setEditTeacherId] = useState("");

  const showT = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const gMap = useMemo(() => new Map(grades.map((x) => [x.id, x])), [grades]);
  const sMap = useMemo(() => new Map(sections.map((x) => [x.id, x])), [sections]);
  const subMap = useMemo(() => new Map(subjects.map((x) => [x.id, x])), [subjects]);
  const tMap = useMemo(() => new Map(teachers.map((x) => [x.id, x])), [teachers]);

  const loadCore = useCallback(async () => {
    const [y, g, sec, subj, t] = await Promise.all([
      listAcademicYears(),
      listGrades(),
      listSections(),
      listSubjects(),
      listUsers("teacher"),
    ]);
    setYears(y);
    setGrades(g);
    setSections(sec);
    setSubjects(subj);
    setTeachers(t);
    const active = y.find((a) => a.isActive && !a.isArchived);
    setYearId((prev) => prev || active?.id || y[0]?.id || "");
  }, []);

  const loadOfferings = useCallback(async (y: string) => {
    if (!y) {
      setOfferings([]);
      return;
    }
    const list = await listClassOfferings(y);
    setOfferings(list);
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        await loadCore();
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [loadCore]);

  useEffect(() => {
    if (!yearId) return;
    let c = false;
    (async () => {
      try {
        await loadOfferings(yearId);
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Failed to load classes");
      }
    })();
    return () => {
      c = true;
    };
  }, [yearId, loadOfferings]);

  const openCreate = () => {
    setForm({
      gradeId: grades[0]?.id ?? "",
      sectionId: sections[0]?.id ?? "",
      subjectId: subjects[0]?.id ?? "",
      teacherId: teachers[0]?.id ?? "",
      name: "",
    });
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!yearId) {
      showT("Select an academic year first.");
      return;
    }
    if (!form.gradeId || !form.sectionId || !form.subjectId || !form.teacherId) {
      showT("Fill grade, section, subject, and teacher.");
      return;
    }
    try {
      await createClassOffering({
        academicYearId: yearId,
        gradeId: form.gradeId,
        sectionId: form.sectionId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        name: form.name.trim() || undefined,
      });
      setShowModal(false);
      await loadOfferings(yearId);
      showT("Class offering created.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Create failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this class offering? Enrollments may block deletion on the server.")) return;
    try {
      await deleteClassOffering(id);
      await loadOfferings(yearId);
      showT("Deleted.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const openEditTeacher = (o: ClassOffering) => {
    setEditId(o.id);
    setEditTeacherId(o.teacherId);
  };

  const saveEditTeacher = async () => {
    if (!editId || !editTeacherId) return;
    try {
      await patchClassOffering(editId, { teacherId: editTeacherId });
      setEditId(null);
      await loadOfferings(yearId);
      showT("Teacher updated.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Update failed");
    }
  };

  const setYearActive = async (id: string) => {
    try {
      await activateAcademicYear(id);
      await loadCore();
      setYearId(id);
      showT("Academic year activated.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Activate failed");
    }
  };

  if (loading && !years.length) {
    return <ClassesSkeleton />;
  }

  const activeYear = years.find((y) => y.isActive && !y.isArchived);
  const assignedTeacherCount = new Set(offerings.map((o) => o.teacherId).filter(Boolean)).size;

  return (
    <div className="page-wrapper">
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: "#fff",
            borderRadius: 14,
            padding: "1rem 1.5rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            border: "1.5px solid var(--success)",
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <div className="classes-hero">
        <div>
          <p className="classes-kicker">
            <Sparkles size={14} />
            Scheduling Hub
          </p>
          <h1 className="classes-title">Class offerings</h1>
          <p className="classes-subtitle">Classes offered this year, with section, subject, and teacher assignment</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate} disabled={!yearId}>
          + New offering
        </button>
      </div>

      <div className="classes-summary-grid">
        <div className="card classes-summary-card">
          <div className="classes-summary-icon blue">
            <BookOpen size={18} />
          </div>
          <div className="classes-summary-label">Offerings</div>
          <div className="classes-summary-value">{offerings.length}</div>
          <div className="classes-summary-note">Current year classes</div>
        </div>
        <div className="card classes-summary-card">
          <div className="classes-summary-icon teal">
            <UserRoundCheck size={18} />
          </div>
          <div className="classes-summary-label">Assigned teachers</div>
          <div className="classes-summary-value">{assignedTeacherCount}</div>
          <div className="classes-summary-note">Unique faculty assigned</div>
        </div>
        <div className="card classes-summary-card">
          <div className="classes-summary-icon orange">
            <GraduationCap size={18} />
          </div>
          <div className="classes-summary-label">Students scope</div>
          <div className="classes-summary-value">{years.length ? "Open" : "Pending"}</div>
          <div className="classes-summary-note">Based on class enrollments</div>
        </div>
        <div className="card classes-summary-card">
          <div className="classes-summary-icon purple">
            <CalendarDays size={18} />
          </div>
          <div className="classes-summary-label">Active year</div>
          <div className="classes-summary-value classes-summary-small">{activeYear?.label ?? "None"}</div>
          <div className="classes-summary-note">Switch or activate below</div>
        </div>
      </div>

      {err && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--danger)", padding: "1rem" }}>
          {err}
        </div>
      )}

      <div className="card classes-panel" style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Academic year</label>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)", minWidth: 220 }}
          >
            {years.length === 0 && <option value="">No years — create one under School setup</option>}
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isActive ? " (active)" : ""}
              </option>
            ))}
          </select>
          {yearId && (
            <button type="button" className="btn btn-secondary" onClick={() => setYearActive(yearId)}>
              <RefreshCcw size={14} />
              Set as active year
            </button>
          )}
        </div>
      </div>

      <div className="card classes-panel">
        <div className="classes-table-head">
          <h3 className="card-title classes-section-title">Class list</h3>
          <span className="admin-dash-chip">{offerings.length} total</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {offerings.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: "var(--gray-500)", padding: "1.5rem" }}>
                    No offerings for this year.
                  </td>
                </tr>
              ) : (
                offerings.map((o) => {
                  const tn = tMap.get(o.teacherId);
                  const tname = tn ? `${tn.firstName} ${tn.lastName}` : "—";
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{labelOffering(o, gMap, sMap, subMap)}</td>
                      <td>{tname}</td>
                      <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link href={`/admin/classes/${o.id}`} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}>
                          Enrollments
                        </Link>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => openEditTeacher(o)}>
                          Change teacher
                        </button>
                        <button type="button" className="btn btn-danger" style={{ fontSize: "0.8rem" }} onClick={() => handleDelete(o.id)}>
                          Delete
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

      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 9998, padding: "1rem" }}>
          <div className="modal" style={{ maxWidth: 520, width: "100%", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>New class offering</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <label>
                Grade
                <select value={form.gradeId} onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.5rem" }}>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Section
                <select value={form.sectionId} onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.5rem" }}>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <select value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.5rem" }}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Teacher
                <select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.5rem" }}>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Optional label
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.5rem" }} placeholder="e.g. Advanced Math" />
              </label>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {editId && (
        <div className="modal-overlay" style={{ zIndex: 9998, padding: "1rem" }}>
          <div className="modal" style={{ maxWidth: 420, width: "100%", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem" }}>Assign teacher</h2>
            <select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} style={{ width: "100%", padding: "0.5rem" }}>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditId(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveEditTeacher}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
