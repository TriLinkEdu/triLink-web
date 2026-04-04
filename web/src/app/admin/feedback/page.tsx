"use client";

import { useEffect, useState } from "react";
import { type FeedbackTicket, type PublicUser, listFeedback, listUsers, patchFeedback } from "@/lib/admin-api";

export default function AdminFeedback() {
  const [rows, setRows] = useState<FeedbackTicket[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="card">
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
                rows.map((t) => {
                  const u = byId.get(t.authorId);
                  return (
                    <tr key={t.id}>
                      <td>{t.category}</td>
                      <td style={{ maxWidth: 320, whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{t.message}</td>
                      <td>{u ? `${u.firstName} ${u.lastName}` : t.authorId.slice(0, 8)}</td>
                      <td>
                        <span className="badge badge-primary">{t.status}</span>
                      </td>
                      <td>
                        <select
                          value={t.status}
                          onChange={(e) => setStatus(t.id, e.target.value)}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                        >
                          <option value="open">open</option>
                          <option value="in_progress">in_progress</option>
                          <option value="resolved">resolved</option>
                          <option value="closed">closed</option>
                        </select>
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
