"use client";
/* eslint-disable react/forbid-dom-props -- kit ports keep inline styles for kit-specific tweaks. */

/**
 * Admin · School setup — the foundation workspace for academic years, terms,
 * grades, sections, and subjects. Rebuilt 100 % on TRILINK kit primitives:
 *
 *  - `<PageHead>` hero + `<StatGrid>` summary tiles (4 cols)
 *  - `.k-card` sections with `.card__head`/`.card__title`/`.card__sub`/`.card__body`
 *  - `.k-field` inputs/selects/checkboxes everywhere
 *  - `.gtable` for the year/term/grade/section/subject tables
 *  - `.btn-kit-*` (primary/secondary/ghost) instead of legacy `.btn`
 *  - `.k-pill` for year status (active / archived)
 *  - Modal dialogs use a `.kit-modal-overlay` + `.k-card` shell (no inline-styled overlays)
 *  - `sonner`-driven toast notifications (the kit's preferred toast surface)
 */

import { useCallback, useEffect, useState } from "react";
import {
  KitSelect,
  KField,
  KitEmpty,
  KitErrorBanner,
  KitToast,
  KitDialog,
} from "@/components/kit/local";
import { useConfirm } from "@/hooks/useConfirm";
import {
  Icon as KitIcon,
  PageHead,
  Pill,
  StatGrid,
  StatTile,
} from "@/components/kit";
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
    <div className="kit-page" data-role="admin">
      <div className="k-card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="admin-skeleton shimmer" style={{ width: 140, height: 10, marginBottom: 12 }} />
        <div className="admin-skeleton shimmer" style={{ width: "60%", height: 22, marginBottom: 8 }} />
        <div className="admin-skeleton shimmer" style={{ width: "45%", height: 12 }} />
      </div>
      <div className="stat-grid cols-4" style={{ marginBottom: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat">
            <div className="admin-skeleton shimmer" style={{ width: "60%", height: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "40%", height: 24 }} />
            <div className="admin-skeleton shimmer" style={{ width: "70%", height: 10 }} />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="k-card" style={{ marginBottom: 14 }}>
          <div className="k-card__head">
            <div className="admin-skeleton shimmer" style={{ width: 160, height: 12 }} />
          </div>
          <div className="k-card__body">
            <div className="admin-skeleton shimmer" style={{ width: "100%", height: 120, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSchoolSetup() {
  const { confirm: confirmDialog, element: confirmEl } = useConfirm();
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

  const showT = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

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
    <div className="kit-page" data-role="admin">
      {toast ? <KitToast message={toast} /> : null}

      <PageHead
        meta={
          <>
            <span className="role-dot" />
            Foundation workspace
            <span className="dot-sep">·</span>
            {activeYears} active year{activeYears === 1 ? "" : "s"}
          </>
        }
        title="School setup"
        sub="Academic years, terms, grades, sections, and subjects."
        actions={
          <button type="button" className="btn-kit btn-kit-secondary" onClick={() => loadAll()}>
            <KitIcon name="refresh" /> Refresh
          </button>
        }
      />

      <StatGrid cols={4} className="!mb-[14px]">
        <StatTile
          icon="cal"
          label="Academic years"
          value={String(years.length)}
          note={`${activeYears} active · ${archivedYears} archived`}
        />
        <StatTile
          icon="layers"
          label="Terms"
          value={String(terms.length)}
          note="For selected academic year"
        />
        <StatTile
          icon="grid"
          label="Structure nodes"
          value={String(grades.length + sections.length)}
          note={`${grades.length} grades · ${sections.length} sections`}
        />
        <StatTile
          icon="book"
          label="Subjects"
          value={String(subjects.length)}
          note="Curriculum catalog"
        />
      </StatGrid>

      {err ? <KitErrorBanner message={err} /> : null}

      {/* Academic years */}
      <section className="k-card" style={{ marginBottom: 14 }}>
        <div className="k-card__head">
          <div>
            <div className="k-card__title">
              <KitIcon name="cal" /> Academic years
            </div>
            <div className="k-card__sub">Define each school year, activate one, and rollover offerings.</div>
          </div>
        </div>

        <div className="k-card__body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr 1fr auto auto",
              gap: 8,
              alignItems: "end",
              marginBottom: 14,
            }}
          >
            <KField label="Label">
              <input
                placeholder="e.g. 2025/2026"
                value={newYear.label}
                onChange={(e) => setNewYear((n) => ({ ...n, label: e.target.value }))}
              />
            </KField>
            <KField label="Start date">
              <input
                type="date"
                value={newYear.startDate}
                onChange={(e) => setNewYear((n) => ({ ...n, startDate: e.target.value }))}
              />
            </KField>
            <KField label="End date">
              <input
                type="date"
                value={newYear.endDate}
                onChange={(e) => setNewYear((n) => ({ ...n, endDate: e.target.value }))}
              />
            </KField>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--ink-2)",
                padding: "7px 0",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={newYear.isActive}
                onChange={(e) => setNewYear((n) => ({ ...n, isActive: e.target.checked }))}
              />
              Set active
            </label>
            <button type="button" className="btn-kit btn-kit-primary" onClick={handleCreateYear}>
              <KitIcon name="plus" /> Create year
            </button>
          </div>

          {years.length === 0 ? (
            <KitEmpty
              title="No academic years yet."
              sub="Create one above to start building grades, sections, and subjects."
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="gtable">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => {
                    const status: "active" | "pending" | "danger" | "default" = y.isArchived
                      ? "danger"
                      : y.isActive
                      ? "active"
                      : "default";
                    return (
                      <tr key={y.id}>
                        <td style={{ fontWeight: 500, color: "var(--ink)" }}>{y.label}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{toDateInput(y.startDate)}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{toDateInput(y.endDate)}</td>
                        <td>
                          <Pill kind={status === "default" ? "neutral" : status}>
                            {y.isArchived ? "Archived" : y.isActive ? "Active" : "Inactive"}
                          </Pill>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "inline-flex",
                              gap: 6,
                              alignItems: "center",
                              justifyContent: "flex-end",
                              width: "100%",
                            }}
                          >
                            <button
                              type="button"
                              className="btn-kit btn-kit-ghost"
                              disabled={y.isArchived || y.isActive}
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
                              <KitIcon name="check" /> Activate
                            </button>
                            <button
                              type="button"
                              className="btn-kit btn-kit-ghost"
                              disabled={y.isArchived}
                              onClick={async () => {
                                const ok = await confirmDialog({
                                  title: "Archive academic year?",
                                  message:
                                    "This will close and deactivate the year. You can re-activate it later.",
                                  confirmLabel: "Archive",
                                });
                                if (!ok) return;
                                try {
                                  await closeAcademicYear(y.id);
                                  await loadYears();
                                  showT("Year closed/archived.");
                                } catch (e) {
                                  showT(e instanceof Error ? e.message : "Failed");
                                }
                              }}
                            >
                              <KitIcon name="archive" /> Close
                            </button>
                            <button
                              type="button"
                              className="btn-kit btn-kit-ghost"
                              onClick={() => setEditYear({ ...y })}
                            >
                              <KitIcon name="edit" /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-kit btn-kit-ghost"
                              onClick={() => {
                                setRolloverId(y.id);
                                setRolloverLabel(`${y.label} (copy)`);
                                setRolloverDry(true);
                              }}
                            >
                              <KitIcon name="refresh" /> Rollover
                            </button>
                            <button
                              type="button"
                              className="btn-kit btn-kit-danger-soft"
                              onClick={async () => {
                                const ok = await confirmDialog({
                                  title: "Delete academic year?",
                                  message:
                                    "This may fail on the server if data still references it. This cannot be undone.",
                                  confirmLabel: "Delete",
                                  destructive: true,
                                });
                                if (!ok) return;
                                try {
                                  await deleteAcademicYear(y.id);
                                  await loadYears();
                                  showT("Deleted.");
                                } catch (e) {
                                  showT(e instanceof Error ? e.message : "Delete failed");
                                }
                              }}
                            >
                              <KitIcon name="trash" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Terms */}
      <section className="k-card" style={{ marginBottom: 14 }}>
        <div className="k-card__head">
          <div>
            <div className="k-card__title">
              <KitIcon name="layers" /> Terms
            </div>
            <div className="k-card__sub">Sub-periods inside a school year (Q1, Semester 1, etc.).</div>
          </div>
          <div style={{ minWidth: 220 }}>
<KitSelect 
              value={termsYearId}
              onChange={(e) => {
                const next = e.target.value;
                setTermsYearId(next);
                if (!next) setTerms([]);
              }}
            >
              {years.length === 0 && <option value="">Create a year first</option>}
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </KitSelect>
          </div>
        </div>

        <div className="k-card__body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr 1fr auto",
              gap: 8,
              alignItems: "end",
              marginBottom: 14,
            }}
          >
            <KField label="Term name">
              <input
                placeholder="e.g. Term 1"
                value={termForm.name}
                onChange={(e) => setTermForm((t) => ({ ...t, name: e.target.value }))}
              />
            </KField>
            <KField label="Start">
              <input
                type="date"
                value={termForm.startDate}
                onChange={(e) => setTermForm((t) => ({ ...t, startDate: e.target.value }))}
              />
            </KField>
            <KField label="End">
              <input
                type="date"
                value={termForm.endDate}
                onChange={(e) => setTermForm((t) => ({ ...t, endDate: e.target.value }))}
              />
            </KField>
            <button
              type="button"
              className="btn-kit btn-kit-primary"
              onClick={handleAddTerm}
              disabled={!termsYearId}
            >
              <KitIcon name="plus" /> Add term
            </button>
          </div>

          {terms.length === 0 ? (
            <KitEmpty
              title="No terms for this year."
              sub="Add at least one term to enable grading periods, attendance windows, and exam scheduling."
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="gtable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500, color: "var(--ink)" }}>{t.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{toDateInput(t.startDate)}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{toDateInput(t.endDate)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-kit btn-kit-danger-soft"
                          onClick={async () => {
                            const ok = await confirmDialog({
                              title: "Delete term?",
                              message: `“${t.name}” will be removed.`,
                              confirmLabel: "Delete",
                              destructive: true,
                            });
                            if (!ok) return;
                            try {
                              await deleteTerm(t.id);
                              await refreshTerms();
                              showT("Term deleted.");
                            } catch (e) {
                              showT(e instanceof Error ? e.message : "Failed");
                            }
                          }}
                        >
                          <KitIcon name="trash" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Grades + Sections side-by-side on wide viewports */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 14,
          marginBottom: 14,
        }}
        className="setup-split"
      >
        {/* Grades */}
        <section className="k-card">
          <div className="k-card__head">
            <div>
              <div className="k-card__title">
                <KitIcon name="grid" /> Grades
              </div>
              <div className="k-card__sub">Year levels (Grade 9, Grade 10…) ordered by `orderIndex`.</div>
            </div>
          </div>
          <div className="k-card__body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 100px auto",
                gap: 8,
                alignItems: "end",
                marginBottom: 14,
              }}
            >
              <KField label="Name">
                <input
                  placeholder="e.g. Grade 10"
                  value={gNew.name}
                  onChange={(e) => setGNew((g) => ({ ...g, name: e.target.value }))}
                />
              </KField>
              <KField label="Order">
                <input
                  placeholder="10"
                  value={gNew.orderIndex}
                  onChange={(e) => setGNew((g) => ({ ...g, orderIndex: e.target.value }))}
                />
              </KField>
              <button
                type="button"
                className="btn-kit btn-kit-primary"
                onClick={async () => {
                  if (!gNew.name.trim()) return;
                  try {
                    const oi = gNew.orderIndex.trim() ? parseInt(gNew.orderIndex, 10) : undefined;
                    await createGrade({
                      name: gNew.name.trim(),
                      orderIndex: Number.isFinite(oi as number) ? oi : undefined,
                    });
                    setGNew({ name: "", orderIndex: "" });
                    await loadStructure();
                    showT("Grade created.");
                  } catch (e) {
                    showT(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                <KitIcon name="plus" /> Add
              </button>
            </div>
            {grades.length === 0 ? (
              <KitEmpty
                title="No grades defined yet."
                sub="Each enrollment/class offering must reference a grade."
              />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="gtable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th style={{ width: 88 }}>Order</th>
                      <th style={{ textAlign: "right", width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <GradeRow
                        key={`${g.id}:${g.name}:${g.orderIndex ?? ""}`}
                        g={g}
                        onSaved={loadStructure}
                        showT={showT}
                        onConfirmDelete={(msg) =>
                          confirmDialog({
                            title: "Delete grade?",
                            message: msg,
                            confirmLabel: "Delete",
                            destructive: true,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Sections */}
        <section className="k-card">
          <div className="k-card__head">
            <div>
              <div className="k-card__title">
                <KitIcon name="layers" /> Sections
              </div>
              <div className="k-card__sub">Cohort labels reused across grades (A, B, C…).</div>
            </div>
          </div>
          <div className="k-card__body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                alignItems: "end",
                marginBottom: 14,
              }}
            >
              <KField label="Name (unique)">
                <input
                  placeholder="e.g. A"
                  value={sNew.name}
                  onChange={(e) => setSNew({ name: e.target.value })}
                />
              </KField>
              <button
                type="button"
                className="btn-kit btn-kit-primary"
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
                <KitIcon name="plus" /> Add
              </button>
            </div>
            {sections.length === 0 ? (
              <KitEmpty
                title="No sections yet."
                sub="Sections combine with grades to produce class offerings (e.g. 10-A)."
              />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="gtable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th style={{ textAlign: "right", width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((s) => (
                      <SectionRow
                        key={`${s.id}:${s.name}`}
                        s={s}
                        onSaved={loadStructure}
                        showT={showT}
                        onConfirmDelete={(msg) =>
                          confirmDialog({
                            title: "Delete section?",
                            message: msg,
                            confirmLabel: "Delete",
                            destructive: true,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Subjects */}
      <section className="k-card" style={{ marginBottom: 14 }}>
        <div className="k-card__head">
          <div>
            <div className="k-card__title">
              <KitIcon name="book" /> Subjects
            </div>
            <div className="k-card__sub">Curriculum catalog reused across class offerings.</div>
          </div>
        </div>
        <div className="k-card__body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr auto",
              gap: 8,
              alignItems: "end",
              marginBottom: 14,
            }}
          >
            <KField label="Name">
              <input
                placeholder="e.g. Mathematics"
                value={subNew.name}
                onChange={(e) => setSubNew((u) => ({ ...u, name: e.target.value }))}
              />
            </KField>
            <KField label="Code (optional)">
              <input
                placeholder="e.g. MATH-10"
                value={subNew.code}
                onChange={(e) => setSubNew((u) => ({ ...u, code: e.target.value }))}
              />
            </KField>
            <button
              type="button"
              className="btn-kit btn-kit-primary"
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
              <KitIcon name="plus" /> Add
            </button>
          </div>

          {subjects.length === 0 ? (
            <KitEmpty
              title="No subjects yet."
              sub="Add subjects so teachers can be assigned to class offerings."
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="gtable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ width: 160 }}>Code</th>
                    <th style={{ textAlign: "right", width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <SubjectRow
                      key={`${s.id}:${s.name}:${s.code ?? ""}`}
                      s={s}
                      onSaved={loadStructure}
                      showT={showT}
                      onConfirmDelete={(msg) =>
                        confirmDialog({
                          title: "Delete subject?",
                          message: msg,
                          confirmLabel: "Delete",
                          destructive: true,
                        })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {editYear ? (
        <KitDialog title="Edit academic year" onClose={() => setEditYear(null)}>
          <KField label="Label">
            <input
              value={editYear.label}
              onChange={(e) => setEditYear((ey) => (ey ? { ...ey, label: e.target.value } : null))}
            />
          </KField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <KField label="Start">
              <input
                type="date"
                value={toDateInput(editYear.startDate)}
                onChange={(e) => setEditYear((ey) => (ey ? { ...ey, startDate: e.target.value } : null))}
              />
            </KField>
            <KField label="End">
              <input
                type="date"
                value={toDateInput(editYear.endDate)}
                onChange={(e) => setEditYear((ey) => (ey ? { ...ey, endDate: e.target.value } : null))}
              />
            </KField>
          </div>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              color: "var(--ink-2)",
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              checked={!!editYear.isArchived}
              onChange={(e) => setEditYear((ey) => (ey ? { ...ey, isArchived: e.target.checked } : null))}
            />
            Archived
          </label>
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
              marginTop: 14,
            }}
          >
            <button type="button" className="btn-kit btn-kit-secondary" onClick={() => setEditYear(null)}>
              Cancel
            </button>
            <button type="button" className="btn-kit btn-kit-primary" onClick={handleSaveEditYear}>
              <KitIcon name="check" /> Save
            </button>
          </div>
        </KitDialog>
      ) : null}

      {rolloverId ? (
        <KitDialog title="Rollover class offerings" onClose={() => setRolloverId(null)}>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--ink-2)",
              margin: "0 0 12px",
              lineHeight: 1.55,
            }}
          >
            Creates a new active year and copies offering shells (no enrollments). Run a dry run first to
            preview how many offerings would copy.
          </p>
          <KField label="New year label">
            <input value={rolloverLabel} onChange={(e) => setRolloverLabel(e.target.value)} />
          </KField>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              color: "var(--ink-2)",
              marginTop: 8,
            }}
          >
            <input
              type="checkbox"
              checked={rolloverDry}
              onChange={(e) => setRolloverDry(e.target.checked)}
            />
            Dry run only
          </label>
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
              marginTop: 14,
            }}
          >
            <button type="button" className="btn-kit btn-kit-secondary" onClick={() => setRolloverId(null)}>
              Cancel
            </button>
            <button type="button" className="btn-kit btn-kit-primary" onClick={handleRollover}>
              <KitIcon name={rolloverDry ? "eye" : "refresh"} /> {rolloverDry ? "Run dry run" : "Rollover"}
            </button>
          </div>
        </KitDialog>
      ) : null}

      <style jsx>{`
        @media (max-width: 1100px) {
          .setup-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {confirmEl}
    </div>
  );
}

function GradeRow({
  g,
  onSaved,
  showT,
  onConfirmDelete,
}: {
  g: Grade;
  onSaved: () => Promise<void>;
  showT: (m: string) => void;
  onConfirmDelete: (msg: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(g.name);
  const [order, setOrder] = useState(g.orderIndex != null ? String(g.orderIndex) : "");
  return (
    <tr>
      <td>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="k-row-input"
          style={inlineInputStyle}
        />
      </td>
      <td>
        <input
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="k-row-input"
          style={{ ...inlineInputStyle, width: 72 }}
        />
      </td>
      <td style={{ textAlign: "right" }}>
        <button
          type="button"
          className="btn-kit btn-kit-ghost"
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
          <KitIcon name="check" /> Save
        </button>
        <button
          type="button"
          className="btn-kit btn-kit-danger-soft"
          onClick={async () => {
            if (!(await onConfirmDelete("Delete this grade?"))) return;
            try {
              await deleteGrade(g.id);
              await onSaved();
              showT("Deleted.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          <KitIcon name="trash" />
        </button>
      </td>
    </tr>
  );
}

function SectionRow({
  s,
  onSaved,
  showT,
  onConfirmDelete,
}: {
  s: Section;
  onSaved: () => Promise<void>;
  showT: (m: string) => void;
  onConfirmDelete: (msg: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(s.name);
  return (
    <tr>
      <td>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="k-row-input"
          style={inlineInputStyle}
        />
      </td>
      <td style={{ textAlign: "right" }}>
        <button
          type="button"
          className="btn-kit btn-kit-ghost"
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
          <KitIcon name="check" /> Save
        </button>
        <button
          type="button"
          className="btn-kit btn-kit-danger-soft"
          onClick={async () => {
            if (!(await onConfirmDelete("Delete this section?"))) return;
            try {
              await deleteSection(s.id);
              await onSaved();
              showT("Deleted.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          <KitIcon name="trash" />
        </button>
      </td>
    </tr>
  );
}

function SubjectRow({
  s,
  onSaved,
  showT,
  onConfirmDelete,
}: {
  s: Subject;
  onSaved: () => Promise<void>;
  showT: (m: string) => void;
  onConfirmDelete: (msg: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(s.name);
  const [code, setCode] = useState(s.code ?? "");
  return (
    <tr>
      <td>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="k-row-input"
          style={inlineInputStyle}
        />
      </td>
      <td>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="k-row-input"
          style={{ ...inlineInputStyle, width: 120, fontFamily: "var(--font-mono)" }}
        />
      </td>
      <td style={{ textAlign: "right" }}>
        <button
          type="button"
          className="btn-kit btn-kit-ghost"
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
          <KitIcon name="check" /> Save
        </button>
        <button
          type="button"
          className="btn-kit btn-kit-danger-soft"
          onClick={async () => {
            if (!(await onConfirmDelete("Delete this subject?"))) return;
            try {
              await deleteSubject(s.id);
              await onSaved();
              showT("Deleted.");
            } catch (e) {
              showT(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          <KitIcon name="trash" />
        </button>
      </td>
    </tr>
  );
}

const inlineInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  borderRadius: 6,
  border: "1px solid var(--color-hairline)",
  background: "var(--color-surface)",
  fontSize: 12.5,
  color: "var(--ink)",
  outline: "none",
};
