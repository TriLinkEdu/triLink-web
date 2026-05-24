"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, GraduationCap, Layers3, RefreshCcw, Search, Sparkles, Users } from "lucide-react";
import Select from "@/components/Select";
import {
  assignStudentsToSection,
  getActiveAcademicYear,
  getSectionsForGrade,
  listAcademicYears,
  listClassOfferings,
  listGrades,
  listStudents,
  type AcademicYear,
  type ClassOffering,
  type Grade,
  type PublicUser,
  type Section,
} from "@/lib/admin-api";
import { useToastStore } from "@/store/toastStore";
import { PageHeader } from "@/components/ui";
import TablePagination from "@/components/TablePagination";

export default function AdminSectionAssignmentPage() {
  const { showToast } = useToastStore();

  const [yearOptions, setYearOptions] = useState<AcademicYear[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Section[]>([]);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);

  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedYear = useMemo(
    () => yearOptions.find((y) => y.id === selectedYearId) ?? null,
    [yearOptions, selectedYearId],
  );
  const selectedGrade = useMemo(
    () => gradeOptions.find((g) => g.id === selectedGradeId) ?? null,
    [gradeOptions, selectedGradeId],
  );
  const selectedSection = useMemo(
    () => sectionOptions.find((s) => s.id === selectedSectionId) ?? null,
    [sectionOptions, selectedSectionId],
  );

  const loadYearsAndGrades = useCallback(async () => {
    const [years, grades, active] = await Promise.all([
      listAcademicYears(),
      listGrades(),
      getActiveAcademicYear().catch(() => null),
    ]);

    setYearOptions(years);
    setGradeOptions(grades);

    const initialYear = active ?? years.find((y) => y.isActive && !y.isArchived) ?? years[0] ?? null;
    if (initialYear) setSelectedYearId(initialYear.id);

    const initialGrade = grades[0] ?? null;
    if (initialGrade) setSelectedGradeId(initialGrade.id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadYearsAndGrades();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load page data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadYearsAndGrades]);

  useEffect(() => {
    if (!selectedGradeId) {
      setSectionOptions([]);
      setSelectedSectionId("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const secs = await getSectionsForGrade(selectedGradeId);
        if (cancelled) return;
        setSectionOptions(secs);
        setSelectedSectionId((prev) => (prev && secs.some((s) => s.id === prev) ? prev : secs[0]?.id ?? ""));
      } catch {
        if (!cancelled) {
          setSectionOptions([]);
          setSelectedSectionId("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedGradeId]);

  const refreshStudentsAndOfferings = useCallback(async () => {
    if (!selectedGrade || !selectedYearId) {
      setStudents([]);
      setOfferings([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const [studentRows, allOfferings] = await Promise.all([
        listStudents({ grade: selectedGrade.name, q: search.trim() || undefined }),
        listClassOfferings(selectedYearId),
      ]);

      setStudents(studentRows);
      setSelectedStudentIds([]);
      setOfferings(
        allOfferings.filter(
          (co) => co.gradeId === selectedGradeId && (!selectedSectionId || co.sectionId === selectedSectionId),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load students");
      setStudents([]);
      setOfferings([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [search, selectedGrade, selectedGradeId, selectedSectionId, selectedYearId]);

  useEffect(() => {
    if (!selectedYearId || !selectedGradeId) return;
    void refreshStudentsAndOfferings();
  }, [refreshStudentsAndOfferings, selectedGradeId, selectedSectionId, selectedYearId]);

  useEffect(() => {
    setPage(0);
  }, [search, selectedGradeId, selectedSectionId]);

  const paginatedStudents = useMemo(() => {
    const start = page * rowsPerPage;
    return students.slice(start, start + rowsPerPage);
  }, [students, page, rowsPerPage]);

  const selectedOfferingCount = offerings.length;
  const selectedSubjectNames = offerings.map((o) => o.subjectName ?? o.displayName ?? o.name ?? o.subjectId);
  const allSelected = students.length > 0 && selectedStudentIds.length === students.length;

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const toggleAll = () => {
    setSelectedStudentIds(allSelected ? [] : students.map((s) => s.id));
  };

  const handleSave = async () => {
    setMessage(null);
    setError(null);

    if (!selectedYearId || !selectedGradeId || !selectedSectionId) {
      setError("Select an academic year, grade, and section first.");
      return;
    }
    if (!selectedStudentIds.length) {
      setError("Select at least one student.");
      return;
    }
    if (!offerings.length) {
      setError("No class offerings exist for this grade/section in the selected academic year.");
      return;
    }

    setSaving(true);
    try {
      const result = await assignStudentsToSection({
        academicYearId: selectedYearId,
        gradeId: selectedGradeId,
        sectionId: selectedSectionId,
        studentIds: selectedStudentIds,
      });

      setMessage(
        `Assigned ${result.studentCount} student(s) to ${result.gradeName} ${result.sectionName} and created ${result.enrollmentsCreated} enrollment(s).`,
      );
      showToast("Students assigned to section successfully.", "success", true);
      await refreshStudentsAndOfferings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="card" style={{ padding: 24, minHeight: 320 }}>
          <div className="admin-skeleton shimmer" style={{ width: 200, height: 18, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "70%", height: 42, marginBottom: 18 }} />
          <div className="admin-skeleton shimmer" style={{ width: "100%", height: 200, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <PageHeader
        kicker="Section assignment"
        title="Assign students to a section"
        subtitle="Update the selected students' grade/section and enroll them in every class offering for that section."
        icon={<Sparkles size={22} />}
        variant="dark"
        actions={
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-secondary" href="/admin/registration">
              Registration
            </Link>
            <Link className="btn btn-primary" href="/admin/school-setup">
              School setup
            </Link>
          </div>
        }
      />

      <div className="school-setup-summary-grid" style={{ marginBottom: "1rem" }}>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon blue"><GraduationCap size={20} /></div>
          <div className="school-setup-summary-label">Academic year</div>
          <div className="school-setup-summary-value">{selectedYear?.label ?? "Select a year"}</div>
        </div>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon teal"><Layers3 size={20} /></div>
          <div className="school-setup-summary-label">Target section</div>
          <div className="school-setup-summary-value">{selectedGrade?.name ?? "—"} {selectedSection?.name ?? ""}</div>
        </div>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon orange"><Users size={20} /></div>
          <div className="school-setup-summary-label">Selected students</div>
          <div className="school-setup-summary-value">{selectedStudentIds.length}</div>
        </div>
        <div className="card school-setup-summary-card">
          <div className="school-setup-summary-icon purple"><CheckCircle2 size={20} /></div>
          <div className="school-setup-summary-label">Section subjects</div>
          <div className="school-setup-summary-value">{selectedOfferingCount}</div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1rem", background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 12, color: "#991b1b" }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ padding: "1rem", marginBottom: "1rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, color: "#166534" }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }}>
          <div className="input-group">
            <label htmlFor="year" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-700)", marginBottom: "0.45rem", display: "block" }}>Academic year</label>
            <Select
              id="year"
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              disabled={yearOptions.length === 0}
              style={{ width: "100%" }}
            >
              {yearOptions.length === 0 ? (
                <option value="">No academic years available</option>
              ) : (
                yearOptions.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.label}{year.isActive ? " (active)" : ""}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="input-group">
            <label htmlFor="grade" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-700)", marginBottom: "0.45rem", display: "block" }}>Grade</label>
            <Select
              id="grade"
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              disabled={gradeOptions.length === 0}
              style={{ width: "100%" }}
            >
              {gradeOptions.length === 0 ? (
                <option value="">No grades available</option>
              ) : (
                gradeOptions.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="input-group">
            <label htmlFor="section" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-700)", marginBottom: "0.45rem", display: "block" }}>Section</label>
            <Select
              id="section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={sectionOptions.length === 0}
              style={{ width: "100%" }}
            >
              {sectionOptions.length === 0 ? (
                <option value="">No sections available</option>
              ) : (
                sectionOptions.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))
              )}
            </Select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginTop: 16, alignItems: "end" }}>
          <div className="input-group">
            <label htmlFor="search" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-700)", marginBottom: "0.45rem", display: "block" }}>Search students</label>
            <div className="input-field" style={{
              border: "1.5px solid rgba(37, 99, 235, 0.25)",
              background: "linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)",
              borderRadius: "12px",
              padding: "0.55rem 0.85rem",
              boxShadow: "0 1px 2px rgba(37, 99, 235, 0.03)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}>
              <Search size={16} style={{ color: "var(--primary-500)", flexShrink: 0 }} />
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.88rem",
                  color: "var(--gray-800)",
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => void refreshStudentsAndOfferings()}
            style={{
              borderRadius: "12px",
              height: "44px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1.5px solid rgba(37, 99, 235, 0.2)",
              background: "#fff",
              color: "var(--primary-700)",
              fontWeight: 700,
              padding: "0.55rem 1.25rem",
              transition: "all 0.2s ease"
            }}
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 4 }}>Students in {selectedGrade?.name ?? "selected grade"}</h3>
            <p style={{ margin: 0, color: "var(--gray-500)" }}>
              Choose the students to move into {selectedGrade?.name ?? "this grade"} {selectedSection?.name ?? ""}.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={toggleAll} disabled={!students.length}>
            {allSelected ? "Clear selection" : "Select all"}
          </button>
        </div>

        {loadingStudents ? (
          <div style={{ padding: 24, color: "var(--gray-500)" }}>Loading students…</div>
        ) : students.length === 0 ? (
          <div style={{ padding: 24, color: "var(--gray-500)" }}>No students found for the selected grade.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }} />
                  <th>Student</th>
                  <th>Current grade</th>
                  <th>Current section</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                      />
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {student.firstName} {student.lastName}
                    </td>
                    <td>{student.grade ?? "—"}</td>
                    <td>{student.section ?? "—"}</td>
                    <td>{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              total={students.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(next) => {
                setRowsPerPage(next);
                setPage(0);
              }}
            />
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, alignItems: "start" }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 8 }}>Enrollment preview</h3>
            <p style={{ marginTop: 0, color: "var(--gray-500)" }}>
              The selected students will be updated to the chosen section and enrolled in these class offerings.
            </p>

            {selectedOfferingCount === 0 ? (
              <div style={{ padding: 14, borderRadius: 12, background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" }}>
                No class offerings were found for this section in the selected academic year.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedSubjectNames.map((name) => (
                  <span
                    key={name}
                    style={{
                      padding: "0.45rem 0.75rem",
                      borderRadius: 999,
                      background: "var(--primary-50)",
                      border: "1px solid var(--primary-200)",
                      color: "var(--primary-800)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Students selected</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{selectedStudentIds.length}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Subjects enrolled</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{selectedOfferingCount}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Assign section & enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}