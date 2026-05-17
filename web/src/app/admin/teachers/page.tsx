"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type PublicUser, listUsers } from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";
import {
  Icon as KitIcon,
  KAvatar,
  KitEmpty,
  KitErrorBanner,
  KitInput,
  KitLoadingBlock,
  PageHead as KitPageHead,
  Pill,
  StatGrid as KitStatGrid,
  StatTile as KitStatTile,
} from "@/components/kit";

export default function AdminTeachers() {
  const [rows, setRows] = useState<PublicUser[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = async (search?: string) => {
    setLoading(true);
    setErr(null);
    try {
      const term = search ?? q;
      setRows(await listUsers("teacher", term.trim() || undefined));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withSubject = rows.filter((t) => !!t.subject).length;
  const withDepartment = rows.filter((t) => !!t.department).length;

  const total = rows.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = rows.slice(startIdx, endIdx);

  if (loading && rows.length === 0) {
    return (
      <div className="kit-page" data-role="admin">
        <KitLoadingBlock label="Loading teachers…" />
      </div>
    );
  }

  return (
    <div className="kit-page" data-role="admin">
      <KitPageHead
        meta={
          <>
            <span className="role-dot" />
            Faculty directory
            <span className="dot-sep">·</span>
            {rows.length} teacher{rows.length === 1 ? "" : "s"}
          </>
        }
        title="Teachers"
        sub="Faculty on staff this academic year."
        actions={
          <Link href="/admin/registration" className="btn-kit btn-kit-primary">
            <KitIcon name="plus" /> Register
          </Link>
        }
      />

      <KitStatGrid cols={3} className="!mb-[14px]">
        <KitStatTile
          icon="users"
          label="Total teachers"
          value={String(rows.length)}
          note="on staff"
        />
        <KitStatTile
          icon="book"
          label="With subject"
          value={String(withSubject)}
          note={
            rows.length > 0 && rows.length - withSubject === 0
              ? "All teachers assigned"
              : `${rows.length - withSubject} unassigned`
          }
        />
        <KitStatTile
          icon="layers"
          label="With department"
          value={String(withDepartment)}
          note="organisational unit"
        />
      </KitStatGrid>

      {err && <KitErrorBanner message={err} />}

      <div className="k-card">
        <div className="k-card__head" style={{ alignItems: "center" }}>
          <div>
            <div className="k-card__title">Directory</div>
            <div className="k-card__sub">
              Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", width: 260 }}>
              <KitIcon
                name="search"
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
              />
              <KitInput
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
                placeholder="Search faculty…"
                style={{ paddingLeft: 28 }}
              />
            </div>
            <button
              type="button"
              className="btn-kit btn-kit-secondary"
              onClick={() => load()}
            >
              <KitIcon name="search" /> Search
            </button>
          </div>
        </div>

        {loading ? (
          <KitLoadingBlock label="Refreshing…" />
        ) : visibleRows.length === 0 ? (
          <div style={{ padding: 16 }}>
            <KitEmpty
              title={q ? "No teachers match your search." : "No teachers yet."}
              sub={
                q
                  ? "Try another name, subject, or department."
                  : "Register your first faculty member to get started."
              }
              action={
                !q ? (
                  <Link href="/admin/registration" className="btn-kit btn-kit-primary">
                    <KitIcon name="plus" /> Register teacher
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <table className="gtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((t) => {
                  const initials = `${t.firstName?.[0] ?? ""}${
                    t.lastName?.[0] ?? ""
                  }`.toUpperCase();
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <KAvatar initials={initials} size="sm" />
                          <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                            {t.firstName} {t.lastName}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>{t.email}</td>
                      <td>
                        {t.subject ? (
                          <Pill kind="neutral">{t.subject}</Pill>
                        ) : (
                          <span style={{ color: "var(--ink-4)" }}>—</span>
                        )}
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>
                        {t.department ?? <span style={{ color: "var(--ink-4)" }}>—</span>}
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
    </div>
  );
}
