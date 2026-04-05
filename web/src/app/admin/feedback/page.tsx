"use client";

import { useEffect, useState } from "react";
import { type FeedbackTicket, type PublicUser, listFeedback, listUsers, patchFeedback } from "@/lib/admin-api";
import { Search } from "lucide-react";
import Select from "@/components/Select";
import TablePagination from "@/components/TablePagination";

export default function AdminFeedback() {
  const [rows, setRows] = useState<FeedbackTicket[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState("");

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [f, u1, u2, u3] = await Promise.all([listFeedback(), listUsers("student"), listUsers("teacher"), listUsers("parent")]);
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

  const byId = new Map(users.map((u) => [u.id, u]));

  const filtered = rows.filter((t) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
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
  const total = filtered.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filtered.slice(startIdx, endIdx);

  const setStatus = async (id: string, status: string) => {
    try {
      await patchFeedback(id, { status });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback tickets</h1>
          <p className="page-subtitle">Tickets from students, teachers, and parents</p>
        </div>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
              placeholder="Filter feedback..."
              style={{
                  width: "100%",
                  padding: "0.65rem 1rem 0.65rem 2.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--gray-200)",
                  fontSize: "0.9rem",
                  outline: "none",
                  background: "var(--gray-50)"
              }}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Message</th>
                <th>Author</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--gray-500)" }}>
                    No tickets.
                  </td>
                </tr>
              ) : (
                visibleRows.map((t) => {
                  const u = t.authorId ? byId.get(t.authorId) : undefined;
                  const authorLabel =
                    u != null
                      ? `${u.firstName} ${u.lastName}`
                      : t.isAnonymous || !t.authorId
                        ? "Anonymous"
                        : `${t.authorId.slice(0, 8)}…`;
                  return (
                    <tr key={t.id}>
                      <td>{t.category}</td>
                      <td style={{ maxWidth: 320, whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{t.message}</td>
                      <td>{authorLabel}</td>
                      <td>
                        <span className="badge badge-primary">{t.status}</span>
                      </td>
                      <td>
                        <Select
                          value={t.status}
                          onChange={(e) => setStatus(t.id, e.target.value)}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                        >
                          <option value="open">open</option>
                          <option value="in_progress">in_progress</option>
                          <option value="resolved">resolved</option>
                          <option value="closed">closed</option>
                        </Select>
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
