"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type FeedbackTicket,
  type PublicUser,
  listFeedback,
  listUsers,
  patchFeedback,
} from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";
import {
  Icon,
  KitEmpty,
  KitErrorBanner,
  KitInput,
  KitLoadingBlock,
  KitSelect,
  KitSpinner,
  PageHead,
  Pill,
  type PillKind,
  StatGrid,
  StatTile,
} from "@/components/kit";

const STATUS_KINDS: Record<string, { kind: PillKind; label: string }> = {
  open: { kind: "danger", label: "Open" },
  new: { kind: "danger", label: "New" },
  in_progress: { kind: "pending", label: "In progress" },
  in_review: { kind: "pending", label: "In review" },
  review: { kind: "pending", label: "In review" },
  resolved: { kind: "active", label: "Resolved" },
  closed: { kind: "neutral", label: "Closed" },
};

function statusBadge(status: string) {
  const key = (status ?? "").toLowerCase();
  const found = STATUS_KINDS[key];
  if (found) return <Pill kind={found.kind}>{found.label}</Pill>;
  return <Pill kind="neutral">{status || "—"}</Pill>;
}

export default function AdminFeedback() {
  const [rows, setRows] = useState<FeedbackTicket[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [f, u1, u2, u3] = await Promise.all([
        listFeedback(),
        listUsers("student"),
        listUsers("teacher"),
        listUsers("parent"),
      ]);
      setRows(f);
      setUsers([...u1, ...u2, ...u3]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filtered = useMemo(() => {
    if (!filterText.trim()) return rows;
    const q = filterText.toLowerCase();
    return rows.filter((t) => {
      const u = t.authorId ? byId.get(t.authorId) : undefined;
      const author = u ? `${u.firstName} ${u.lastName}`.toLowerCase() : "";
      const anon = t.isAnonymous || !t.authorId;
      const authorMatch = anon ? "anonymous".includes(q) : author.includes(q);
      return (
        authorMatch ||
        (t.message ?? "").toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q) ||
        (t.status ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filterText, byId]);

  const total = filtered.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filtered.slice(startIdx, endIdx);

  const setStatus = async (id: string, status: string) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      await patchFeedback(id, { status });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const open = rows.filter(
    (r) => (r.status ?? "").toLowerCase().includes("open") || (r.status ?? "").toLowerCase() === "new",
  ).length;
  const inReview = rows.filter(
    (r) =>
      (r.status ?? "").toLowerCase().includes("review") ||
      (r.status ?? "").toLowerCase().includes("progress"),
  ).length;
  const resolved = rows.filter(
    (r) =>
      (r.status ?? "").toLowerCase().includes("resolv") ||
      (r.status ?? "").toLowerCase().includes("close"),
  ).length;
  const anonymous = rows.filter((r) => r.isAnonymous || !r.authorId).length;

  return (
    <div className="kit-page" data-role="admin">
      <PageHead
        meta={
          <>
            <span className="role-dot" />
            Community voice
            <span className="dot-sep">·</span>
            {rows.length} ticket{rows.length === 1 ? "" : "s"} this term
          </>
        }
        title="Feedback tickets"
        sub="Tickets from students, teachers, and parents."
      />

      <StatGrid cols={4} className="!mb-[14px]">
        <StatTile icon="inbox" label="Open" value={String(open)} note="needs triage" />
        <StatTile icon="clock" label="In review" value={String(inReview)} note="being handled" />
        <StatTile icon="check" label="Resolved" value={String(resolved)} note="closed out" />
        <StatTile icon="shield" label="Anonymous" value={String(anonymous)} note="of total" />
      </StatGrid>

      {err && <KitErrorBanner message={err} />}

      <div className="k-card">
        <div className="k-card__head" style={{ alignItems: "center" }}>
          <div>
            <div className="k-card__title">Tickets</div>
            <div className="k-card__sub">
              Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
            </div>
          </div>
          <div style={{ position: "relative", width: 260 }}>
            <Icon
              name="search"
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
            />
            <KitInput
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(0);
              }}
              placeholder="Filter feedback…"
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {loading ? (
          <KitLoadingBlock label="Loading feedback…" />
        ) : visibleRows.length === 0 ? (
          <div style={{ padding: 16 }}>
            <KitEmpty
              title={filterText ? "No tickets match your filter." : "No tickets yet."}
              sub={
                filterText
                  ? "Try a different category or message."
                  : "When community members submit feedback, it will appear here."
              }
            />
          </div>
        ) : (
          <>
            <table className="gtable">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Category</th>
                  <th>Message</th>
                  <th style={{ width: 180 }}>Author</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 160 }}>Set status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((t) => {
                  const u = t.authorId ? byId.get(t.authorId) : undefined;
                  const anon = t.isAnonymous || !t.authorId;
                  const authorLabel =
                    u != null
                      ? `${u.firstName} ${u.lastName}`
                      : anon
                        ? "Anonymous"
                        : `${(t.authorId ?? "").slice(0, 8)}…`;
                  return (
                    <tr key={t.id}>
                      <td>
                        <Pill kind="neutral">{t.category}</Pill>
                      </td>
                      <td
                        style={{
                          maxWidth: 360,
                          whiteSpace: "pre-wrap",
                          fontSize: 12.5,
                          lineHeight: 1.55,
                          color: "var(--ink-2)",
                        }}
                      >
                        {t.message}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "var(--ink-2)",
                            fontSize: 12.5,
                          }}
                        >
                          {anon ? (
                            <Icon name="shield" size={12} />
                          ) : null}
                          {authorLabel}
                        </div>
                      </td>
                      <td>{statusBadge(t.status)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <KitSelect
                            value={t.status}
                            onChange={(e) => setStatus(t.id, e.target.value)}
                            disabled={savingIds.has(t.id)}
                            style={{ height: 28, fontSize: 12 }}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </KitSelect>
                          {savingIds.has(t.id) ? <KitSpinner size={12} /> : null}
                        </div>
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
