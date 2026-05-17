"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type ParentLink,
  type PublicUser,
  createParentLink,
  deleteParentLink,
  listParentLinks,
  listUsers,
} from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";
import { useConfirm } from "@/hooks/useConfirm";
import {
  Icon as KitIcon,
  KField,
  KitEmpty,
  KitErrorBanner,
  KitInput,
  KitLoadingBlock,
  KitSelect,
  PageHead as KitPageHead,
  Pill,
  StatGrid as KitStatGrid,
  StatTile as KitStatTile,
} from "@/components/kit";

export default function AdminParents() {
  const { confirm, element: confirmEl } = useConfirm();
  const [parents, setParents] = useState<PublicUser[]>([]);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState("");
  const [form, setForm] = useState({ parentId: "", studentId: "", relationship: "Father" });
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [p, s, l] = await Promise.all([
        listUsers("parent"),
        listUsers("student"),
        listParentLinks(),
      ]);
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

  const parentMap = useMemo(() => new Map(parents.map((u) => [u.id, u])), [parents]);
  const studentMap = useMemo(() => new Map(students.map((u) => [u.id, u])), [students]);

  const addLink = async () => {
    if (!form.parentId || !form.studentId) return;
    setLinking(true);
    try {
      await createParentLink({
        parentId: form.parentId,
        studentId: form.studentId,
        relationship: form.relationship,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Link failed");
    } finally {
      setLinking(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Remove link?",
      message: "This will remove the parent–student relationship. The accounts will not be deleted.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteParentLink(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const filteredLinks = useMemo(() => {
    if (!filterText.trim()) return links;
    const q = filterText.toLowerCase();
    return links.filter((l) => {
      const p = parentMap.get(l.parentId);
      const s = studentMap.get(l.studentId);
      const pn = p ? `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase() : "";
      const sn = s ? `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase() : "";
      return pn.includes(q) || sn.includes(q) || l.relationship.toLowerCase().includes(q);
    });
  }, [links, filterText, parentMap, studentMap]);

  const total = filteredLinks.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filteredLinks.slice(startIdx, endIdx);

  const linkRate =
    parents.length > 0 ? `${Math.round((links.length / parents.length) * 100)}% of parents linked` : "no parents yet";

  if (loading && !parents.length && !students.length && !links.length) {
    return (
      <div className="kit-page" data-role="admin">
        <KitLoadingBlock label="Loading parents…" />
      </div>
    );
  }

  return (
    <div className="kit-page" data-role="admin">
      <KitPageHead
        meta={
          <>
            <span className="role-dot" />
            Guardian mapping
            <span className="dot-sep">·</span>
            {links.length} link{links.length === 1 ? "" : "s"}
          </>
        }
        title={<>Parents &amp; links</>}
        sub="Link guardians to the right student records."
        actions={
          <Link href="/admin/registration" className="btn-kit btn-kit-primary">
            <KitIcon name="plus" /> Register parent
          </Link>
        }
      />

      <KitStatGrid cols={3} className="!mb-[14px]">
        <KitStatTile
          icon="family"
          label="Parents"
          value={String(parents.length)}
          note="registered guardians"
        />
        <KitStatTile
          icon="users"
          label="Students"
          value={String(students.length)}
          note="linkable records"
        />
        <KitStatTile
          icon="check"
          label="Existing links"
          value={String(links.length)}
          note={linkRate}
        />
      </KitStatGrid>

      {err && <KitErrorBanner message={err} />}

      {/* Add link panel */}
      <div className="k-card" style={{ marginBottom: 14 }}>
        <div className="k-card__head">
          <div className="k-card__title">
            <KitIcon name="shield" /> Add parent–student link
          </div>
          <div className="k-card__sub">Match a guardian to a student record by relationship.</div>
        </div>
        <div
          className="k-card__body parents-link-form"
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            alignItems: "end",
          }}
        >
          <KField label="Parent">
            <KitSelect
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              disabled={parents.length === 0}
            >
              {parents.length === 0 ? (
                <option value="">No parents registered</option>
              ) : (
                parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} · {p.email}
                  </option>
                ))
              )}
            </KitSelect>
          </KField>
          <KField label="Student">
            <KitSelect
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              disabled={students.length === 0}
            >
              {students.length === 0 ? (
                <option value="">No students registered</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))
              )}
            </KitSelect>
          </KField>
          <KField label="Relationship">
            <KitSelect
              value={form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
            >
              <option>Father</option>
              <option>Mother</option>
              <option>Guardian</option>
            </KitSelect>
          </KField>
          <div style={{ display: "flex", justifyContent: "flex-end", gridColumn: "1 / -1" }}>
            <button
              type="button"
              className="btn-kit btn-kit-primary"
              onClick={addLink}
              disabled={linking || !parents.length || !students.length}
              style={{ height: 32 }}
            >
              <KitIcon name="plus" /> {linking ? "Linking…" : "Create link"}
            </button>
          </div>
        </div>
        <style jsx>{`
          @media (min-width: 900px) {
            :global(.parents-link-form) {
              grid-template-columns:
                minmax(0, 1fr) minmax(0, 1fr) minmax(0, 160px) auto !important;
            }
            :global(.parents-link-form > div:last-child) {
              grid-column: auto !important;
              justify-content: flex-start !important;
            }
          }
        `}</style>
      </div>

      {/* Existing links */}
      <div className="k-card">
        <div className="k-card__head" style={{ alignItems: "center" }}>
          <div>
            <div className="k-card__title">Existing links</div>
            <div className="k-card__sub">
              Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: 240 }}>
              <KitIcon
                name="search"
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
              />
              <KitInput
                placeholder="Search parents, students…"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setPage(0);
                }}
                style={{ paddingLeft: 28 }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <KitLoadingBlock label="Refreshing…" />
        ) : visibleRows.length === 0 ? (
          <div style={{ padding: 16 }}>
            <KitEmpty
              title={filterText ? "No links match your search." : "No parent–student links yet."}
              sub={
                filterText
                  ? "Try a different name or relationship."
                  : "Create your first link with the form above."
              }
            />
          </div>
        ) : (
          <>
            <table className="gtable">
              <thead>
                <tr>
                  <th>Parent</th>
                  <th>Student</th>
                  <th>Relationship</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((l) => {
                  const p = parentMap.get(l.parentId);
                  const s = studentMap.get(l.studentId);
                  return (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                          {p ? `${p.firstName} ${p.lastName}` : "Unknown parent"}
                        </div>
                        {p && (
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.email}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                          {s ? `${s.firstName} ${s.lastName}` : "Unknown student"}
                        </div>
                        {s && (
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.email}</div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--ink-2)",
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-hairline)",
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {l.relationship}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-kit btn-kit-danger-soft"
                          onClick={() => remove(l.id)}
                        >
                          <KitIcon name="trash" /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination
              page={currentPage}
              rowsPerPage={rowsPerPage}
              total={total}
              onPageChange={setPage}
              onRowsPerPageChange={(n) => {
                setRowsPerPage(n);
                setPage(0);
              }}
            />
          </>
        )}
      </div>
      {confirmEl}
    </div>
  );
}
