"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, GraduationCap, RefreshCcw, Sparkles, UserRoundCheck } from "lucide-react";
import { Search } from "lucide-react";
import Select from "@/components/Select";
import TablePagination from "@/components/TablePagination";
import {
  type AcademicYear,
  type ClassOffering,
  type Grade,
  type PublicUser,
  type Section,
  type Subject,
  activateAcademicYear,
  bulkCreateClassOfferings,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState("");
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

  // Bulk creation state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    gradeId: "",
    teacherId: "",
    sectionIds: [] as string[],
    subjectIds: [] as string[],
  });
  const [loadingBulkCreate, setLoadingBulkCreate] = useState(false);

  const filteredOfferings = offerings.filter(o => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const label = labelOffering(o, gMap, sMap, subMap).toLowerCase();
    const teacher = tMap.get(o.teacherId);
    const tn = teacher ? `${teacher.firstName} ${teacher.lastName}`.toLowerCase() : "";
    return label.includes(q) || tn.includes(q);
  });
  const total = filteredOfferings.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filteredOfferings.slice(startIdx, endIdx);


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

  // Bulk creation handlers
  const openBulkCreate = () => {
    setBulkForm({
      gradeId: grades[0]?.id ?? "",
      teacherId: teachers[0]?.id ?? "",
      sectionIds: [],
      subjectIds: [],
    });
    setShowBulkModal(true);
  };

  const toggleSection = (sectionId: string) => {
    setBulkForm((prev) => ({
      ...prev,
      sectionIds: prev.sectionIds.includes(sectionId)
        ? prev.sectionIds.filter((id) => id !== sectionId)
        : [...prev.sectionIds, sectionId],
    }));
  };

  const toggleSubject = (subjectId: string) => {
    setBulkForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  const selectAllSections = () => {
    setBulkForm((prev) => ({ ...prev, sectionIds: sections.map((s) => s.id) }));
  };

  const deselectAllSections = () => {
    setBulkForm((prev) => ({ ...prev, sectionIds: [] }));
  };

  const selectAllSubjects = () => {
    setBulkForm((prev) => ({ ...prev, subjectIds: subjects.map((s) => s.id) }));
  };

  const deselectAllSubjects = () => {
    setBulkForm((prev) => ({ ...prev, subjectIds: [] }));
  };

  const handleBulkCreate = async () => {
    if (!yearId) {
      showT("Select an academic year first.");
      return;
    }
    if (!bulkForm.gradeId || !bulkForm.teacherId) {
      showT("Select grade and teacher.");
      return;
    }
    if (bulkForm.sectionIds.length === 0) {
      showT("Select at least one section.");
      return;
    }
    if (bulkForm.subjectIds.length === 0) {
      showT("Select at least one subject.");
      return;
    }

    try {
      setLoadingBulkCreate(true);
      const result = await bulkCreateClassOfferings({
        academicYearId: yearId,
        gradeId: bulkForm.gradeId,
        sectionIds: bulkForm.sectionIds,
        subjectIds: bulkForm.subjectIds,
        teacherId: bulkForm.teacherId,
      });
      setShowBulkModal(false);
      await loadOfferings(yearId);
      showT(`Created ${result.created} offerings${result.skipped > 0 ? `, skipped ${result.skipped}` : ""}`);
    } catch (e) {
      showT(e instanceof Error ? e.message : "Bulk create failed");
    } finally {
      setLoadingBulkCreate(false);
    }
  };

  const bulkOfferingsCount = bulkForm.sectionIds.length * bulkForm.subjectIds.length;

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
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={openCreate} disabled={!yearId}>
            + Single offering
          </button>
          <button type="button" className="btn btn-primary" onClick={openBulkCreate} disabled={!yearId}>
            + Bulk create
          </button>
        </div>
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
          <Select
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
            style={{ padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", fontWeight: 600, minWidth: 220, outline: "none", cursor: "pointer" }}
          >
            {years.length === 0 && <option value="">No years — create one under School setup</option>}
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isActive ? " (active)" : ""}
              </option>
            ))}
          </Select>
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
                visibleRows.map((o) => {
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
                <Select value={form.gradeId} onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none" }}>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Section
                <Select value={form.sectionId} onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none" }}>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Subject
                <Select value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none" }}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Teacher
                <Select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none" }}>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Optional label
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none" }} placeholder="e.g. Advanced Math" />
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
            <Select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none" }}>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </Select>
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

      {showBulkModal && (
        <div className="modal-overlay" style={{ zIndex: 9998, padding: "1rem" }}>
          <div className="modal" style={{ maxWidth: 680, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Bulk create class offerings</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", marginBottom: "1.5rem" }}>
              Select multiple sections and subjects to create all combinations at once
            </p>

            <div style={{ display: "grid", gap: "1.25rem" }}>
              {/* Teacher Selection */}
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Teacher *</label>
                <Select
                  value={bulkForm.teacherId}
                  onChange={(e) => setBulkForm((f) => ({ ...f, teacherId: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid var(--gray-300)", outline: "none" }}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Grade Selection */}
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Grade *</label>
                <Select
                  value={bulkForm.gradeId}
                  onChange={(e) => setBulkForm((f) => ({ ...f, gradeId: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid var(--gray-300)", outline: "none" }}
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Sections Selection */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontWeight: 600 }}>Sections * ({bulkForm.sectionIds.length} selected)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={selectAllSections}
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", background: "var(--primary-50)", color: "var(--primary-700)", border: "1px solid var(--primary-200)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllSections}
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", background: "var(--gray-50)", color: "var(--gray-700)", border: "1px solid var(--gray-300)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem" }}>
                  {sections.map((section) => {
                    const isSelected = bulkForm.sectionIds.includes(section.id);
                    return (
                      <label
                        key={section.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.6rem 0.8rem",
                          border: `2px solid ${isSelected ? "var(--primary-500)" : "var(--gray-300)"}`,
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: isSelected ? "var(--primary-50)" : "#fff",
                          transition: "all 0.2s",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSection(section.id)}
                          style={{ cursor: "pointer", width: "16px", height: "16px" }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>{section.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subjects Selection */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontWeight: 600 }}>Subjects * ({bulkForm.subjectIds.length} selected)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={selectAllSubjects}
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", background: "var(--primary-50)", color: "var(--primary-700)", border: "1px solid var(--primary-200)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllSubjects}
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", background: "var(--gray-50)", color: "var(--gray-700)", border: "1px solid var(--gray-300)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem" }}>
                  {subjects.map((subject) => {
                    const isSelected = bulkForm.subjectIds.includes(subject.id);
                    return (
                      <label
                        key={subject.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.6rem 0.8rem",
                          border: `2px solid ${isSelected ? "var(--primary-500)" : "var(--gray-300)"}`,
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: isSelected ? "var(--primary-50)" : "#fff",
                          transition: "all 0.2s",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubject(subject.id)}
                          style={{ cursor: "pointer", width: "16px", height: "16px" }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>{subject.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {bulkOfferingsCount > 0 && (
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--primary-50)",
                    border: "2px solid var(--primary-200)",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", color: "var(--primary-700)", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Will create
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--primary-800)" }}>
                    {bulkOfferingsCount}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--primary-700)", fontWeight: 600 }}>
                    class offerings
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginTop: "0.5rem" }}>
                    ({bulkForm.sectionIds.length} sections × {bulkForm.subjectIds.length} subjects)
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBulkModal(false)}
                disabled={loadingBulkCreate}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBulkCreate}
                disabled={loadingBulkCreate || bulkOfferingsCount === 0}
              >
                {loadingBulkCreate ? "Creating..." : `Create ${bulkOfferingsCount} offerings`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
