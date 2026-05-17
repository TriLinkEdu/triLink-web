"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KitSelect, KitDialog, KitToast, KitInput } from "@/components/kit/local";
import {
  Icon as KitIcon,
  PageHead as KitPageHead,
  Pill,
  StatGrid as KitStatGrid,
  StatTile as KitStatTile,
} from "@/components/kit";
import TablePagination from "@/components/TablePagination";
import { useConfirm } from "@/hooks/useConfirm";
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
  const { confirm, element: confirmEl } = useConfirm();
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

  const showT = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const gMap = useMemo(() => new Map(grades.map((x) => [x.id, x])), [grades]);
  const sMap = useMemo(() => new Map(sections.map((x) => [x.id, x])), [sections]);
  const subMap = useMemo(() => new Map(subjects.map((x) => [x.id, x])), [subjects]);
  const tMap = useMemo(() => new Map(teachers.map((x) => [x.id, x])), [teachers]);

  const filteredOfferings = offerings.filter((o) => {
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
    const ok = await confirm({
      title: "Delete class offering?",
      message:
        "Existing enrollments may block deletion on the server. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
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
    <div className="kit-page" data-role="admin">
      {toast ? <KitToast message={toast} /> : null}

      <KitPageHead
        meta={
          <>
            <span className="role-dot" />
            Academic structure
            <span className="dot-sep">·</span>
            {activeYear?.label ?? "No active year"}
          </>
        }
        title="Class offerings"
        sub="Classes offered this year, with section, subject, and teacher assignment."
        actions={
          <button
            type="button"
            className="btn-kit btn-kit-primary"
            onClick={openCreate}
            disabled={!yearId}
          >
            <KitIcon name="plus" /> New offering
          </button>
        }
      />

      <KitStatGrid cols={4} className="!mb-[14px]">
        <KitStatTile icon="book" label="Offerings" value={String(offerings.length)} note="current year classes" />
        <KitStatTile icon="user" label="Assigned teachers" value={String(assignedTeacherCount)} note="unique faculty" />
        <KitStatTile icon="cap" label="Students scope" value={years.length ? "Open" : "Pending"} note="enrollment-based" />
        <KitStatTile icon="cal" label="Active year" value={activeYear?.label ?? "None"} note="switch below" />
      </KitStatGrid>

      {err ? (
        <div
          role="alert"
          className="k-card"
          style={{
            padding: "10px 14px",
            background: "var(--color-danger-soft)",
            borderColor: "rgba(196,53,84,0.18)",
            color: "var(--color-danger)",
            fontSize: 12.5,
            marginBottom: 14,
          }}
        >
          {err}
        </div>
      ) : null}

      {/* Filter toolbar */}
      <div
        className="k-card"
        style={{
          padding: 12,
          marginBottom: 14,
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.4fr) 1fr auto",
          gap: 10,
          alignItems: "end",
        }}
      >
        <div className="k-field">
          <span className="k-field__label">Academic year</span>
          <KitSelect value={yearId} onChange={(e) => setYearId(e.target.value)}>
            {years.length === 0 && (
              <option value="">No years — create one under School setup</option>
            )}
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isActive ? " (active)" : ""}
              </option>
            ))}
          </KitSelect>
        </div>
        <div className="k-field">
          <span className="k-field__label">Search</span>
          <div style={{ position: "relative" }}>
            <KitIcon
              name="search"
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
                pointerEvents: "none",
              }}
            />
            <KitInput
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(0);
              }}
              placeholder="Search by class label or teacher name"
              style={{ paddingLeft: 30 }}
            />
          </div>
        </div>
        {yearId ? (
          <button
            type="button"
            className="btn-kit btn-kit-secondary"
            onClick={() => setYearActive(yearId)}
            disabled={years.find((y) => y.id === yearId)?.isActive}
          >
            <KitIcon name="refresh" /> Set as active year
          </button>
        ) : (
          <span />
        )}
      </div>

      <section className="k-card">
        <div className="k-card__head">
          <div>
            <div className="k-card__title">
              <KitIcon name="book" /> Class list
            </div>
            <div className="k-card__sub">
              {filterText.trim()
                ? `${total} of ${offerings.length} match “${filterText}”`
                : `${offerings.length} offering${offerings.length === 1 ? "" : "s"} this year`}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gtable">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ textAlign: "right", width: 240 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {total === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 28, textAlign: "center", color: "var(--ink-3)" }}>
                    {offerings.length === 0
                      ? "No offerings for this year."
                      : "No offerings match the current filter."}
                  </td>
                </tr>
              ) : (
                visibleRows.map((o) => {
                  const tn = tMap.get(o.teacherId);
                  const tname = tn ? `${tn.firstName} ${tn.lastName}` : "—";
                  const hasTeacher = Boolean(o.teacherId && tn);
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500, color: "var(--ink)" }}>
                        {labelOffering(o, gMap, sMap, subMap)}
                      </td>
                      <td>{tname}</td>
                      <td>
                        <Pill kind={hasTeacher ? "active" : "pending"}>
                          {hasTeacher ? "Staffed" : "Unstaffed"}
                        </Pill>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            gap: 6,
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <Link href={`/admin/classes/${o.id}`} className="btn-kit btn-kit-ghost">
                            <KitIcon name="users" /> Enrollments
                          </Link>
                          <button
                            type="button"
                            className="btn-kit btn-kit-ghost"
                            onClick={() => openEditTeacher(o)}
                          >
                            <KitIcon name="edit" /> Teacher
                          </button>
                          <button
                            type="button"
                            className="btn-kit btn-kit-danger-soft"
                            onClick={() => handleDelete(o.id)}
                          >
                            <KitIcon name="trash" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          total={total}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => {
            setRowsPerPage(v);
            setPage(0);
          }}
        />
      </section>

      {showModal ? (
        <KitDialog title="New class offering" onClose={() => setShowModal(false)}>
          <div className="k-field">
            <span className="k-field__label">Grade</span>
            <KitSelect
              value={form.gradeId}
              onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </KitSelect>
          </div>
          <div className="k-field">
            <span className="k-field__label">Section</span>
            <KitSelect
              value={form.sectionId}
              onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </KitSelect>
          </div>
          <div className="k-field">
            <span className="k-field__label">Subject</span>
            <KitSelect
              value={form.subjectId}
              onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </KitSelect>
          </div>
          <div className="k-field">
            <span className="k-field__label">Teacher</span>
            <KitSelect
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.email})
                </option>
              ))}
            </KitSelect>
          </div>
          <div className="k-field">
            <span className="k-field__label">Optional label</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Advanced Math"
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              className="btn-kit btn-kit-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn-kit btn-kit-primary" onClick={handleCreate}>
              <KitIcon name="plus" /> Create offering
            </button>
          </div>
        </KitDialog>
      ) : null}

      {editId ? (
        <KitDialog title="Assign teacher" onClose={() => setEditId(null)}>
          <div className="k-field">
            <span className="k-field__label">Teacher</span>
            <KitSelect
              value={editTeacherId}
              onChange={(e) => setEditTeacherId(e.target.value)}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </KitSelect>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              className="btn-kit btn-kit-secondary"
              onClick={() => setEditId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-kit btn-kit-primary"
              onClick={saveEditTeacher}
            >
              <KitIcon name="check" /> Save
            </button>
          </div>
        </KitDialog>
      ) : null}
      {confirmEl}
    </div>
  );
}

