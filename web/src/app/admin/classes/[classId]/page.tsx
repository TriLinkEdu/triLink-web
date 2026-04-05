"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "@/components/Select";
import {
  type ClassOffering,
  type Enrollment,
  type PublicUser,
  createEnrollment,
  deleteEnrollment,
  getClassOffering,
  listEnrollments,
  listUsers,
} from "@/lib/admin-api";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const [offering, setOffering] = useState<ClassOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [pickStudent, setPickStudent] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    load();
  }, [load]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.studentId)), [enrollments]);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const addEnrollment = async () => {
    if (!offering || !pickStudent) return;
    try {
      await createEnrollment({
        studentId: pickStudent,
        classOfferingId: offering.id,
        academicYearId: offering.academicYearId,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Enroll failed");
    }
  };

  const removeEnr = async (id: string) => {
    if (!confirm("Remove this enrollment?")) return;
    try {
      await deleteEnrollment(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Remove failed");
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <p style={{ color: "var(--gray-500)" }}>Loading…</p>
      </div>
    );
  }

  if (err && !offering) {
    return (
      <div className="page-wrapper">
        <div className="card" style={{ padding: "1.5rem", color: "var(--danger)" }}>
          {err}
        </div>
        <button type="button" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => router.push("/admin/classes")}>
          Back to classes
        </button>
      </div>
    );
  }

  if (!offering) return null;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--blue-600)",
              cursor: "pointer",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
            onClick={() => router.push("/admin/classes")}
          >
            ← Back to classes
          </button>
          <h1 className="page-title">{offering.displayName?.trim() || offering.name?.trim() || "Class"}</h1>
          <p className="page-subtitle">Roster and enrollments</p>
        </div>
      </div>

      {err && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--danger)", padding: "0.75rem 1rem" }}>
          {err}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title" style={{ marginBottom: "1rem" }}>
          Enrollments
        </h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
          <Select value={pickStudent} onChange={(e) => setPickStudent(e.target.value)} style={{ padding: "0.5rem", minWidth: 220 }}>
            {students
              .filter((s) => !enrolledIds.has(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} · {s.email}
                </option>
              ))}
          </Select>
          <button type="button" className="btn btn-primary" onClick={addEnrollment} disabled={!pickStudent || students.filter((s) => !enrolledIds.has(s.id)).length === 0}>
            Add student
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: "var(--gray-500)" }}>
                    No enrollments yet.
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => {
                  const s = studentMap.get(e.studentId);
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{s ? `${s.firstName} ${s.lastName}` : "Student"}</td>
                      <td>{e.status}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeEnr(e.id)}>
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
    </div>
  );
}
