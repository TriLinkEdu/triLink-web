"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, CalendarDays, Layers3, LayoutGrid, RefreshCcw, Sparkles } from "lucide-react";
import Select from "@/components/Select";
import {
  activateAcademicYear,
  addTerm,
  closeAcademicYear,
  createAcademicYear,
  createGrade,
  createSection,
  createSubject,
  deleteAcademicYear,
  deleteGrade,
  deleteSection,
  deleteSubject,
  deleteTerm,
  listAcademicYears,
  listGrades,
  listSections,
  listSubjects,
  listTerms,
  patchAcademicYear,
  patchGrade,
  patchSection,
  patchSubject,
  rolloverAcademicYear,
  type AcademicYear,
  type Grade,
  type Section,
  type Subject,
  type TermRow,
} from "@/lib/admin-api";

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function SchoolSetupSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="school-setup-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div className="admin-skeleton shimmer" style={{ width: 140, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "85%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "65%", height: 14 }} />
        </div>
        <div className="admin-skeleton shimmer" style={{ width: 94, height: 36, borderRadius: 999 }} />
      </div>

      <div className="school-setup-summary-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="card school-setup-summary-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "65%", height: 12, marginBottom: 8 }} />
            <div className="admin-skeleton shimmer" style={{ width: "40%", height: 24 }} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="card school-setup-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 220, height: 20, marginBottom: 16 }} />
            <div className="admin-skeleton shimmer" style={{ width: "100%", height: 160, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSchoolSetup() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [termsYearId, setTermsYearId] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [newYear, setNewYear] = useState({ label: "", startDate: "", endDate: "", isActive: false });
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [rolloverId, setRolloverId] = useState<string | null>(null);
  const [rolloverLabel, setRolloverLabel] = useState("");
  const [rolloverDry, setRolloverDry] = useState(true);

  const [termForm, setTermForm] = useState({ name: "", startDate: "", endDate: "" });

  const [gNew, setGNew] = useState({ name: "", orderIndex: "" });
  const [sNew, setSNew] = useState({ name: "" });
  const [subNew, setSubNew] = useState({ name: "", code: "" });

  const showT = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadStructure = useCallback(async () => {
    const [g, sec, subj] = await Promise.all([listGrades(), listSections(), listSubjects()]);
    setGrades(g);
    setSections(sec);
    setSubjects(subj);
  }, []);

  const loadYears = useCallback(async () => {
    const y = await listAcademicYears();
    setYears(y);
    setTermsYearId((prev) => {
      if (prev && y.some((a) => a.id === prev)) return prev;
      const active = y.find((a) => a.isActive && !a.isArchived);
      return active?.id ?? y[0]?.id ?? "";
    });
  }, []);

  const loadAll = useCallback(async () => {
    setErr(null);
    try {
      await Promise.all([loadYears(), loadStructure()]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [loadYears, loadStructure]);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      await loadAll();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [loadAll]);

  useEffect(() => {
    if (!termsYearId) return;
    let c = false;
    (async () => {
      try {
        const t = await listTerms(termsYearId);
        if (!c) setTerms(t);
      } catch {
        if (!c) setTerms([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [termsYearId]);

  const refreshTerms = async () => {
    if (!termsYearId) return;
    setTerms(await listTerms(termsYearId));
  };

  const activeYears = years.filter((y) => y.isActive && !y.isArchived).length;
  const archivedYears = years.filter((y) => y.isArchived).length;

  const handleCreateYear = async () => {
    if (!newYear.label.trim() || !newYear.startDate || !newYear.endDate) {
      showT("Label and both dates are required.");
      return;
    }
    try {
      await createAcademicYear({
        label: newYear.label.trim(),
        startDate: newYear.startDate,
        endDate: newYear.endDate,
        isActive: newYear.isActive,
      });
      setNewYear({ label: "", startDate: "", endDate: "", isActive: false });
      await loadYears();
      showT("Academic year created.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Create failed");
    }
  };

  const handleSaveEditYear = async () => {
    if (!editYear) return;
    try {
      await patchAcademicYear(editYear.id, {
        label: editYear.label,
        startDate: editYear.startDate?.slice(0, 10),
        endDate: editYear.endDate?.slice(0, 10),
        isArchived: editYear.isArchived,
      });
      setEditYear(null);
      await loadYears();
      showT("Year updated.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleRollover = async () => {
    if (!rolloverId || !rolloverLabel.trim()) return;
    try {
      const r = await rolloverAcademicYear(rolloverId, rolloverLabel.trim(), rolloverDry);
      if (rolloverDry) {
        showT(`Dry run: would copy ${r.offeringsCopied} offering(s).`);
      } else {
        showT(`Rolled over: new year ${r.createdYearId?.slice(0, 8)}…, ${r.offeringsCopied} offering(s).`);
        setRolloverId(null);
        setRolloverLabel("");
        await loadYears();
      }
    } catch (e) {
      showT(e instanceof Error ? e.message : "Rollover failed");
    }
  };

  const handleAddTerm = async () => {
    if (!termsYearId || !termForm.name.trim() || !termForm.startDate || !termForm.endDate) {
      showT("Select a year and fill term name and dates.");
      return;
    }
    try {
      await addTerm(termsYearId, {
        name: termForm.name.trim(),
        startDate: termForm.startDate,
        endDate: termForm.endDate,
      });
      setTermForm({ name: "", startDate: "", endDate: "" });
      await refreshTerms();
      showT("Term added.");
    } catch (e) {
      showT(e instanceof Error ? e.message : "Add term failed");
    }
  };

  if (loading && !years.length) {
    return <SchoolSetupSkeleton />;
  }

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

      <div className="school-setup-hero">
        <div>
          <p className="school-setup-kicker">
            <Sparkles size={14} />
            Foundation Workspace
          </p>
          <h1 className="school-setup-title">School setup</h1>
          <p className="school-setup-subtitle">Academic years, terms, grades, sections, and subjects</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => loadAll()}>
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="school-setup-summary-grid">
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon blue">
            <CalendarDays size={18} />
          </div>
          <div className="school-setup-summary-label">Academic years</div>
          <div className="school-setup-summary-value">{years.length}</div>
          <div className="school-setup-summary-note">{activeYears} active, {archivedYears} archived</div>
        </div>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon teal">
            <LayoutGrid size={18} />
          </div>
          <div className="school-setup-summary-label">Terms</div>
          <div className="school-setup-summary-value">{terms.length}</div>
          <div className="school-setup-summary-note">For selected academic year</div>
        </div>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon orange">
            <Layers3 size={18} />
          </div>
          <div className="school-setup-summary-label">Structure nodes</div>
          <div className="school-setup-summary-value">{grades.length + sections.length}</div>
          <div className="school-setup-summary-note">{grades.length} grades and {sections.length} sections</div>
        </div>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon purple">
            <BookOpen size={18} />
          </div>
          <div className="school-setup-summary-label">Subjects</div>
          <div className="school-setup-summary-value">{subjects.length}</div>
          <div className="school-setup-summary-note">Curriculum catalog</div>
        </div>
      </div>

      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}

      {/* Academic years */}
      <div className="card school-setup-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title school-setup-section-title" style={{ marginBottom: "0.75rem" }}>
          <CalendarDays size={16} />
          Academic years
        </h3>
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem", maxWidth: 480 }}>
          <input
            placeholder="Label (e.g. 2025/2026)"
            value={newYear.label}
            onChange={(e) => setNewYear((n) => ({ ...n, label: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
          />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <label style={{ fontSize: "0.85rem" }}>
              Start
              <input
                type="date"
                value={newYear.startDate}
                onChange={(e) => setNewYear((n) => ({ ...n, startDate: e.target.value }))}
                style={{ display: "block", marginTop: 4, padding: "0.35rem" }}
              />
            </label>
            <label style={{ fontSize: "0.85rem" }}>
              End
              <input
                type="date"
                value={newYear.endDate}
                onChange={(e) => setNewYear((n) => ({ ...n, endDate: e.target.value }))}
                style={{ display: "block", marginTop: 4, padding: "0.35rem" }}
              />
            </label>
          </div>
          <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={newYear.isActive}
              onChange={(e) => setNewYear((n) => ({ ...n, isActive: e.target.checked }))}
            />
            Set as active year on create
          </label>
          <button type="button" className="btn btn-primary" onClick={handleCreateYear}>
            Create year
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {years.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--gray-500)" }}>
                    No years yet.
                  </td>
                </tr>
              ) : (
                years.map((y) => (
                  <tr key={y.id}>
                    <td>{y.label}</td>
                    <td>{toDateInput(y.startDate)}</td>
                    <td>{toDateInput(y.endDate)}</td>
                    <td>
                      {y.isArchived ? "archived" : y.isActive ? "active" : "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 4 }}
                        disabled={y.isArchived}
                        onClick={async () => {
                          try {
                            await activateAcademicYear(y.id);
                            await loadYears();
                            showT("Activated.");
                          } catch (e) {
                            showT(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 4 }}
                        disabled={y.isArchived}
                        onClick={async () => {
                          if (!confirm("Archive and deactivate this year?")) return;
                          try {
                            await closeAcademicYear(y.id);
                            await loadYears();
                            showT("Year closed/archived.");
                          } catch (e) {
                            showT(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Close
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ marginRight: 4 }} onClick={() => setEditYear({ ...y })}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 4 }}
                        onClick={() => {
                          setRolloverId(y.id);
                          setRolloverLabel(`${y.label} (copy)`);
                          setRolloverDry(true);
                        }}
                      >
                        Rollover
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          if (!confirm("Delete this academic year? This may fail if data still references it.")) return;
                          try {
                            await deleteAcademicYear(y.id);
                            await loadYears();
                            showT("Deleted.");
                          } catch (e) {
                            showT(e instanceof Error ? e.message : "Delete failed");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms */}
      <div className="card school-setup-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title school-setup-section-title" style={{ marginBottom: "0.75rem" }}>
          <LayoutGrid size={16} />
          Terms
        </h3>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Academic year</label>
        <Select
          value={termsYearId}
          onChange={(e) => {
            const next = e.target.value;
            setTermsYearId(next);
            if (!next) setTerms([]);
          }}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)", marginBottom: "1rem", minWidth: 220 }}
        >
          {years.length === 0 && <option value="">Create a year first</option>}
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
            </option>
          ))}
        </Select>
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem", maxWidth: 480 }}>
          <input
            placeholder="Term name"
            value={termForm.name}
            onChange={(e) => setTermForm((t) => ({ ...t, name: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
          />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input type="date" value={termForm.startDate} onChange={(e) => setTermForm((t) => ({ ...t, startDate: e.target.value }))} />
            <input type="date" value={termForm.endDate} onChange={(e) => setTermForm((t) => ({ ...t, endDate: e.target.value }))} />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleAddTerm} disabled={!termsYearId}>
            Add term
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--gray-500)" }}>
                    No terms for this year.
                  </td>
                </tr>
              ) : (
                terms.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{toDateInput(t.startDate)}</td>
                    <td>{toDateInput(t.endDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          if (!confirm("Delete this term?")) return;
                          try {
                            await deleteTerm(t.id);
                            await refreshTerms();
                            showT("Term deleted.");
                          } catch (e) {
                            showT(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grades */}
      <div className="card school-setup-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title school-setup-section-title" style={{ marginBottom: "0.75rem" }}>
          <Layers3 size={16} />
          Grades
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <input
            placeholder="Name"
            value={gNew.name}
            onChange={(e) => setGNew((g) => ({ ...g, name: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
          />
          <input
            placeholder="Order (optional)"
            value={gNew.orderIndex}
            onChange={(e) => setGNew((g) => ({ ...g, orderIndex: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)", width: 120 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              if (!gNew.name.trim()) return;
              try {
                const oi = gNew.orderIndex.trim() ? parseInt(gNew.orderIndex, 10) : undefined;
                await createGrade({ name: gNew.name.trim(), orderIndex: Number.isFinite(oi as number) ? oi : undefined });
                setGNew({ name: "", orderIndex: "" });
                await loadStructure();
                showT("Grade created.");
              } catch (e) {
                showT(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Order</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <GradeRow key={`${g.id}:${g.name}:${g.orderIndex ?? ""}`} g={g} onSaved={loadStructure} showT={showT} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sections */}
      <div className="card school-setup-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title school-setup-section-title" style={{ marginBottom: "0.75rem" }}>
          <LayoutGrid size={16} />
          Sections
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <input
            placeholder="Name (unique)"
            value={sNew.name}
            onChange={(e) => setSNew({ name: e.target.value })}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              if (!sNew.name.trim()) return;
              try {
                await createSection({ name: sNew.name.trim() });
                setSNew({ name: "" });
                await loadStructure();
                showT("Section created.");
              } catch (e) {
                showT(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <SectionRow key={`${s.id}:${s.name}`} s={s} onSaved={loadStructure} showT={showT} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subjects */}
      <div className="card school-setup-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title school-setup-section-title" style={{ marginBottom: "0.75rem" }}>
          <BookOpen size={16} />
          Subjects
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <input
            placeholder="Name"
            value={subNew.name}
            onChange={(e) => setSubNew((u) => ({ ...u, name: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
          />
          <input
            placeholder="Code (optional)"
            value={subNew.code}
            onChange={(e) => setSubNew((u) => ({ ...u, code: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              if (!subNew.name.trim()) return;
              try {
                await createSubject({ name: subNew.name.trim(), code: subNew.code.trim() || undefined });
                setSubNew({ name: "", code: "" });
                await loadStructure();
                showT("Subject created.");
              } catch (e) {
                showT(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <SubjectRow key={`${s.id}:${s.name}:${s.code ?? ""}`} s={s} onSaved={loadStructure} showT={showT} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editYear && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%" }}>
            <h3 className="card-title" style={{ marginBottom: "0.75rem" }}>
              Edit academic year
            </h3>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem" }}>
              Label
              <input
                value={editYear.label}
                onChange={(e) => setEditYear((ey) => (ey ? { ...ey, label: e.target.value } : null))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem" }}>
              Start
              <input
                type="date"
                value={toDateInput(editYear.startDate)}
                onChange={(e) => setEditYear((ey) => (ey ? { ...ey, startDate: e.target.value } : null))}
                style={{ display: "block", marginTop: 4 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem" }}>
              End
              <input
                type="date"
                value={toDateInput(editYear.endDate)}
                onChange={(e) => setEditYear((ey) => (ey ? { ...ey, endDate: e.target.value } : null))}
                style={{ display: "block", marginTop: 4 }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", fontSize: "0.85rem" }}>
              <input
                type="checkbox"
                checked={!!editYear.isArchived}
                onChange={(e) => setEditYear((ey) => (ey ? { ...ey, isArchived: e.target.checked } : null))}
              />
              Archived
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditYear(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEditYear}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {rolloverId && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%" }}>
            <h3 className="card-title" style={{ marginBottom: "0.75rem" }}>
              Rollover class offerings
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: "0.75rem" }}>
              Creates a new active year and copies offering shells (no enrollments). Run a dry run first to see how many offerings would copy.
            </p>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem" }}>
              New year label
              <input
                value={rolloverLabel}
                onChange={(e) => setRolloverLabel(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem" }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", fontSize: "0.85rem" }}>
              <input type="checkbox" checked={rolloverDry} onChange={(e) => setRolloverDry(e.target.checked)} />
              Dry run only
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRolloverId(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleRollover}>
                {rolloverDry ? "Run dry run" : "Rollover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GradeRow({ g, onSaved, showT }: { g: Grade; onSaved: () => Promise<void>; showT: (m: string) => void }) {
  const [name, setName] = useState(g.name);
  const [order, setOrder] = useState(g.orderIndex != null ? String(g.orderIndex) : "");
  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "0.35rem" }} />
      </td>
      <td>
        <input value={order} onChange={(e) => setOrder(e.target.value)} style={{ width: 80, padding: "0.35rem" }} />
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginRight: 4 }}
          onClick={async () => {
            try {
              const oi = order.trim() ? parseInt(order, 10) : undefined;
              await patchGrade(g.id, {
                name: name.trim() || g.name,
                orderIndex: Number.isFinite(oi as number) ? oi : undefined,
              });
              await onSaved();
              showT("Grade saved.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            if (!confirm("Delete this grade?")) return;
            try {
              await deleteGrade(g.id);
              await onSaved();
              showT("Deleted.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function SectionRow({ s, onSaved, showT }: { s: Section; onSaved: () => Promise<void>; showT: (m: string) => void }) {
  const [name, setName] = useState(s.name);
  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "0.35rem" }} />
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginRight: 4 }}
          onClick={async () => {
            try {
              await patchSection(s.id, { name: name.trim() || s.name });
              await onSaved();
              showT("Section saved.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            if (!confirm("Delete this section?")) return;
            try {
              await deleteSection(s.id);
              await onSaved();
              showT("Deleted.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function SubjectRow({ s, onSaved, showT }: { s: Subject; onSaved: () => Promise<void>; showT: (m: string) => void }) {
  const [name, setName] = useState(s.name);
  const [code, setCode] = useState(s.code ?? "");
  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "0.35rem" }} />
      </td>
      <td>
        <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: 120, padding: "0.35rem" }} />
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginRight: 4 }}
          onClick={async () => {
            try {
              await patchSubject(s.id, {
                name: name.trim() || s.name,
                code: code.trim() ? code.trim() : null,
              });
              await onSaved();
              showT("Subject saved.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            if (!confirm("Delete this subject?")) return;
            try {
              await deleteSubject(s.id);
              await onSaved();
              showT("Deleted.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
