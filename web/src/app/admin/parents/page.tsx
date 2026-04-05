"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Link2, Search, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { type ParentLink, type PublicUser, createParentLink, deleteParentLink, listParentLinks, listUsers } from "@/lib/admin-api";
import Select from "@/components/Select";
import TablePagination from "@/components/TablePagination";

function ParentsSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="parents-hero admin-dash-skeleton-block">
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div className="admin-skeleton shimmer" style={{ width: 140, height: 12, marginBottom: 12 }} />
          <div className="admin-skeleton shimmer" style={{ width: "80%", height: 34, marginBottom: 10 }} />
          <div className="admin-skeleton shimmer" style={{ width: "64%", height: 14 }} />
        </div>
      </div>
      <div className="parents-summary-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="card parents-summary-card admin-dash-skeleton-block" key={i}>
            <div className="admin-skeleton shimmer" style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 10 }} />
            <div className="admin-skeleton shimmer" style={{ width: "55%", height: 12, marginBottom: 8 }} />
            <div className="admin-skeleton shimmer" style={{ width: "35%", height: 22 }} />
          </div>
        ))}
      </div>
      <div className="card admin-dash-skeleton-block" style={{ marginBottom: "1rem" }}>
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 230, borderRadius: 12 }} />
      </div>
      <div className="card admin-dash-skeleton-block">
        <div className="admin-skeleton shimmer" style={{ width: "100%", height: 230, borderRadius: 12 }} />
      </div>
    </div>
  );
}

export default function AdminParents() {
  const [parents, setParents] = useState<PublicUser[]>([]);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState("");
  const [form, setForm] = useState({ parentId: "", studentId: "", relationship: "Father" });

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [p, s, l] = await Promise.all([listUsers("parent"), listUsers("student"), listParentLinks()]);
      setParents(p);
      setStudents(s);
      setLinks(l);
      setForm((f) => ({
        ...f,
        parentId: f.parentId || p[0]?.id || "",
        studentId: f.studentId || s[0]?.id || "",
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parentMap = new Map(parents.map((u) => [u.id, u]));
  const studentMap = new Map(students.map((u) => [u.id, u]));

  const addLink = async () => {
    if (!form.parentId || !form.studentId) return;
    try {
      await createParentLink({
        parentId: form.parentId,
        studentId: form.studentId,
        relationship: form.relationship,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Link failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove link?")) return;
    try {
      await deleteParentLink(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  
  const filteredLinks = links.filter(l => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const p = parentMap.get(l.parentId);
    const s = studentMap.get(l.studentId);
    const pn = p ? `${p.firstName} ${p.lastName}`.toLowerCase() : "";
    const sn = s ? `${s.firstName} ${s.lastName}`.toLowerCase() : "";
    return pn.includes(q) || sn.includes(q) || l.relationship.toLowerCase().includes(q);
  });
  const total = filteredLinks.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filteredLinks.slice(startIdx, endIdx);


  if (loading && !parents.length && !students.length && !links.length) {
    return <ParentsSkeleton />;
  }

  return (
    <div className="page-wrapper">
      <div className="parents-hero">
        <div>
          <p className="parents-kicker">
            <Sparkles size={14} />
            Guardian Mapping
          </p>
          <h1 className="parents-title">Parents & links</h1>
          <p className="parents-subtitle">Link guardians to the right student records</p>
        </div>
        <Link href="/admin/registration" className="btn btn-primary">
          + Register parent
        </Link>
      </div>

      <div className="parents-summary-grid">
        <div className="card parents-summary-card">
          <div className="parents-summary-icon blue">
            <UserRound size={18} />
          </div>
          <div className="parents-summary-label">Parents</div>
          <div className="parents-summary-value">{parents.length}</div>
        </div>
        <div className="card parents-summary-card">
          <div className="parents-summary-icon teal">
            <Users size={18} />
          </div>
          <div className="parents-summary-label">Students</div>
          <div className="parents-summary-value">{students.length}</div>
        </div>
        <div className="card parents-summary-card">
          <div className="parents-summary-icon orange">
            <Link2 size={18} />
          </div>
          <div className="parents-summary-label">Existing links</div>
          <div className="parents-summary-value">{links.length}</div>
        </div>
      </div>

      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}

      <div className="card parents-panel" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title parents-section-title" style={{ marginBottom: "1rem" }}>
          <ShieldCheck size={16} />
          Add parent–student link
        </h3>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
          <label>
            Parent
            <Select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none", cursor: "pointer", fontWeight: 500 }}>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.email})
                </option>
              ))}
            </Select>
          </label>
          <label>
            Student
            <Select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none", cursor: "pointer", fontWeight: 500 }}>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Relationship
            <Select value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} style={{ width: "100%", marginTop: 4, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--primary-200)", background: "var(--primary-50)", color: "var(--primary-800)", outline: "none", cursor: "pointer", fontWeight: 500 }}>
              <option>Father</option>
              <option>Mother</option>
              <option>Guardian</option>
            </Select>
          </label>
          <button type="button" className="btn btn-primary" onClick={addLink} disabled={loading || !parents.length || !students.length}>
            <Search size={14} />
            Create link
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <h3 className="card-title parents-section-title" style={{ marginBottom: "1rem" }}>
          Existing links
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Parent</th>
                <th>Student</th>
                <th>Relationship</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>Loading…</td>
                </tr>
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--gray-500)" }}>
                    No links.
                  </td>
                </tr>
              ) : (
                visibleRows.map((l) => {
                  const p = parentMap.get(l.parentId);
                  const s = studentMap.get(l.studentId);
                  return (
                    <tr key={l.id}>
                      <td>{p ? `${p.firstName} ${p.lastName}` : "Unknown parent"}</td>
                      <td>{s ? `${s.firstName} ${s.lastName}` : "Unknown student"}</td>
                      <td>{l.relationship}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => remove(l.id)}>
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
