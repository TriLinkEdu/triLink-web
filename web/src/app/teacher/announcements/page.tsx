"use client";

import { useCallback, useEffect, useState } from "react";
import {
  announcementsForMe,
  createAnnouncement,
  getActiveAcademicYear,
  listAllClassOfferings as listOfferings,
  type Announcement,
  type ClassOffering,
} from "@/lib/admin-api";

function offeringLabel(o: ClassOffering) {
  return o.displayName || o.name?.trim() || "Untitled Class";
}

export default function TeacherAnnouncements() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [yearId, setYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "students" | "parents" | "class">("students");
  const [classOfferingId, setClassOfferingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [ann, year] = await Promise.all([announcementsForMe(), getActiveAcademicYear()]);
      setRows(ann);
      setYearId(year?.id ?? null);
      if (year?.id) {
        const mine = await listOfferings(year.id);
        setOfferings(mine);
        setClassOfferingId((prev) => (prev && mine.some((o) => o.id === prev) ? prev : mine[0]?.id ?? ""));
      } else {
        setOfferings([]);
        setClassOfferingId("");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    if (!title.trim() || !body.trim()) {
      showToast("Title and message are required.");
      return;
    }
    if (!yearId) {
      showToast("No active academic year. Ask an admin to activate one.");
      return;
    }
    if (audience === "class" && !classOfferingId) {
      showToast("Pick a class for a class-scoped announcement.");
      return;
    }
    setSaving(true);
    try {
      await createAnnouncement({
        academicYearId: yearId,
        title: title.trim(),
        body: body.trim(),
        audience: audience === "class" ? "class" : audience,
        classOfferingId: audience === "class" ? classOfferingId : undefined,
      });
      setTitle("");
      setBody("");
      setAudience("students");
      setShowCreateModal(false);
      await load();
      showToast("Published.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="page-wrapper">
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "1.25rem",
            right: "1.25rem",
            zIndex: 9999,
            background: "var(--gray-900)",
            color: "#fff",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            maxWidth: 320,
          }}
        >
          {toast}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">School-wide feed from the API · publish to your audiences</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New announcement
        </button>
      </div>

      {err && <div className="card" style={{ marginBottom: "1rem", color: "var(--danger)" }}>{err}</div>}

      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 640, margin: 0, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>
                Create announcement
              </h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCreateModal(false)}>
                Close
              </button>
            </div>
            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label>Title</label>
              <div className="input-field">
                <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label>Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
                style={{
                  padding: "0.75rem 1rem",
                  background: "var(--gray-50)",
                  border: "1.5px solid var(--gray-200)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  width: "100%",
                }}
              >
                <option value="all">All (whole school)</option>
                <option value="students">Students</option>
                <option value="parents">Parents</option>
                <option value="class">One class offering</option>
              </select>
            </div>
            {audience === "class" && (
              <div className="input-group" style={{ marginBottom: "1rem" }}>
                <label>Class offering</label>
                <select
                  value={classOfferingId}
                  onChange={(e) => setClassOfferingId(e.target.value)}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "var(--gray-50)",
                    border: "1.5px solid var(--gray-200)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    width: "100%",
                  }}
                >
                  {offerings.length === 0 && <option value="">No offerings this year</option>}
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {offeringLabel(o)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label>Message</label>
              <textarea
                placeholder="Announcement body"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  padding: "0.75rem 1rem",
                  background: "var(--gray-50)",
                  border: "1.5px solid var(--gray-200)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  resize: "vertical",
                  width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary" onClick={() => void handlePublish()} disabled={saving}>
                {saving ? "Publishing…" : "Publish"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: "1rem" }}>
          All announcements ({sorted.length})
        </h3>
        {loading ? (
          <p style={{ color: "var(--gray-500)" }}>Loading…</p>
        ) : sorted.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--gray-400)" }}>No announcements yet.</p>
        ) : (
          sorted.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                width: "100%",
                padding: "0.85rem 0.95rem",
                background: "var(--gray-50)",
                borderRadius: "var(--radius-md)",
                marginBottom: "0.5rem",
                gap: "0.75rem",
                border: "1px solid var(--gray-100)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{a.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", margin: "0.2rem 0" }}>
                  {a.audience}
                  {a.classOfferingId ? ` · ${offeringLabel(offerings.find((o) => o.id === a.classOfferingId) || ({ id: a.classOfferingId } as ClassOffering))}` : ""} · {new Date(a.createdAt).toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--gray-600)",
                    marginTop: "0.25rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {a.body}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 640, width: "92%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selected.title}</h3>
              <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ fontSize: "0.9rem", color: "var(--gray-700)" }}>
              <p style={{ marginBottom: "0.75rem", fontSize: "0.8rem", color: "var(--gray-500)" }}>
                Audience: <strong>{selected.audience}</strong>
                {selected.classOfferingId ? ` · ${offeringLabel(offerings.find((o) => o.id === selected.classOfferingId) || ({ id: selected.classOfferingId } as ClassOffering))}` : ""}
                <br />
                {new Date(selected.createdAt).toLocaleString()}
              </p>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selected.body}</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
