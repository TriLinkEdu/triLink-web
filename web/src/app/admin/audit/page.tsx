"use client";

import { useEffect, useState } from "react";
import { listAuditLogs, listUsers, type PublicUser } from "@/lib/admin-api";

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
      }
    })();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity log</h1>
          <p className="page-subtitle">Important account and security events across your school</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem", background: "#f8fafc", border: "1px solid var(--gray-200)" }}>
        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.55, color: "var(--gray-700)" }}>
          This log helps you review who did what—sign-ins, new registrations, and password updates. Routine browsing (opening pages, lists) is not recorded here.
          Logout is handled in the browser, so it does not create a row. Older entries roll off as new activity arrives.
        </p>
      </div>

      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>What</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--gray-500)" }}>
                    No activity yet. Sign out and sign in again, or register a user—the log will show those events.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const who = nameById.get(r.actorId) ?? "Staff member";
                  return (
                    <tr key={r.id}>
                      <td style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{who}</td>
                      <td>{describeAction(r.action)}</td>
                      <td style={{ fontSize: "0.9rem", color: "var(--gray-700)" }}>{describeDetails(r)}</td>
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
