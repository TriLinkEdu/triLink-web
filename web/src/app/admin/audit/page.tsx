"use client";

import { useEffect, useState } from "react";
import { listAuditLogs, listUsers, type PublicUser } from "@/lib/admin-api";
import TablePagination from "@/components/TablePagination";
import {
  Icon,
  KitEmpty,
  KitErrorBanner,
  KitInput,
  KitLoadingBlock,
  PageHead,
  Pill,
  StatGrid,
  StatTile,
  type PillKind,
} from "@/components/kit";

type Row = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  diffJson?: string | null;
  createdAt: string;
};

function describeAction(action: string): string {
  switch (action) {
    case "user.login":
      return "Signed in";
    case "user.register":
      return "Registered a new user";
    case "user.password_change":
      return "Changed password";
    default:
      return action.replace(/\./g, " · ");
  }
}

function describeDetails(row: Row): string {
  if (!row.diffJson) {
    if (row.action === "user.login") return "Admin portal session started";
    if (row.action === "user.password_change") return "Account password updated";
    return "—";
  }
  try {
    const d = JSON.parse(row.diffJson) as Record<string, unknown>;
    if (row.action === "user.register") {
      const email = typeof d.email === "string" ? d.email : "";
      const role = typeof d.role === "string" ? d.role : "";
      const name = typeof d.name === "string" ? d.name : "";
      const bits = [name, email, role].filter(Boolean);
      return bits.length ? bits.join(" · ") : "New account";
    }
    if (row.action === "user.login") {
      const portal = typeof d.portalRole === "string" ? d.portalRole : "";
      return portal ? `Signed in as ${portal}` : "Signed in";
    }
  } catch {
    /* ignore */
  }
  return "—";
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [nameById, setNameById] = useState<Map<string, string>>(new Map());
  const [err, setErr] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [data, everyone] = await Promise.all([listAuditLogs(150), listUsers()]);
        setRows(data as Row[]);
        const m = new Map<string, string>();
        (everyone as PublicUser[]).forEach((u) => {
          m.set(u.id, `${u.firstName} ${u.lastName}`.trim() || u.email);
        });
        setNameById(m);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredRows = rows.filter((r) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const who = (nameById.get(r.actorId) ?? "Staff member").toLowerCase();
    const action = describeAction(r.action).toLowerCase();
    const details = describeDetails(r).toLowerCase();
    const when = new Date(r.createdAt).toLocaleString().toLowerCase();
    return who.includes(q) || action.includes(q) || details.includes(q) || when.includes(q);
  });

  const total = filteredRows.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filteredRows.slice(startIdx, endIdx);

  const signIns = rows.filter((r) => r.action === "user.login").length;
  const registrations = rows.filter((r) => r.action === "user.register").length;
  const passwordChanges = rows.filter((r) => r.action === "user.password_change").length;

  return (
    <div className="kit-page" data-role="admin">
      <PageHead
        meta={
          <>
            <span className="role-dot" />
            Security
            <span className="dot-sep">·</span>
            Read-only · last {rows.length} events
          </>
        }
        title="Audit log"
        sub="Sign-ins, registrations, and password changes across the school."
      />

      <StatGrid cols={4} className="!mb-[14px]">
        <StatTile icon="history" label="Total events" value={String(rows.length)} note="last 150" />
        <StatTile icon="lock" label="Sign-ins" value={String(signIns)} note="admin portal" />
        <StatTile icon="users" label="Registrations" value={String(registrations)} note="new users" />
        <StatTile icon="shield" label="Password changes" value={String(passwordChanges)} note="security updates" />
      </StatGrid>

      {err && <KitErrorBanner message={err} />}

      <div className="k-card">
        <div className="k-card__head" style={{ alignItems: "center" }}>
          <div>
            <div className="k-card__title">Activity</div>
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
              type="text"
              placeholder="Filter by name, action, time…"
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(0);
              }}
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {isLoading ? (
          <KitLoadingBlock label="Loading activity logs…" />
        ) : visibleRows.length === 0 ? (
          <div style={{ padding: 16 }}>
            <KitEmpty
              title={filterText ? "No activity matches your filter." : "No activity recorded."}
              sub={
                filterText
                  ? "Try a different search term."
                  : "Sign-ins, registrations, and password changes will appear here as they happen."
              }
            />
          </div>
        ) : (
          <>
            <table className="gtable">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>When</th>
                  <th style={{ width: 200 }}>Who</th>
                  <th style={{ width: 200 }}>What</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const who = nameById.get(r.actorId) ?? "Staff member";
                  return (
                    <tr key={r.id}>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--ink-2)",
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--ink)" }}>{who}</td>
                      <td>
                        <Pill kind={actionKind(r.action)}>{describeAction(r.action)}</Pill>
                      </td>
                      <td style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                        {describeDetails(r)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination
              total={total}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function actionKind(action: string): PillKind {
  if (action === "user.login") return "active";
  if (action === "user.register") return "brand";
  if (action === "user.password_change") return "pending";
  return "neutral";
}
