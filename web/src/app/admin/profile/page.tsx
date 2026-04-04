"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, patchUser, uploadProfileImage, type PublicUser } from "@/lib/admin-api";
import { authFetch, getStoredUser } from "@/lib/auth";
import { apiPath, getApiBase } from "@/lib/api";

function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "teacher":
      return "Teacher";
    case "student":
      return "Student";
    case "parent":
      return "Parent";
    default:
      return role;
  }
}

export default function AdminProfile() {
  const stored = getStoredUser();
  const [u, setU] = useState<PublicUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  useEffect(() => {
    const uid = stored?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const row = await getUser(uid);
        setU(row);
        setFirstName(row.firstName);
        setLastName(row.lastName);
        setPhone(row.phone ?? "");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [stored?.id]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      const fileId = u?.profileImageFileId;
      if (!fileId) {
        setAvatarUrl(null);
        return;
      }
      try {
        const res = await authFetch(`${getApiBase()}/api/files/${fileId}/download`, { method: "GET" });
        if (!res.ok) throw new Error("Image load failed");
        const blob = await res.blob();
        const nextUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        objectUrl = nextUrl;
        setAvatarUrl(nextUrl);
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [u?.profileImageFileId]);

  const saveProfile = async () => {
    if (!stored?.id) return;
    setErr(null);
    setOk(null);
    try {
      const row = await patchUser(stored.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setU(row);
      setOk("Profile updated.");
      setTimeout(() => setOk(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr(null);
    setPwdMsg(null);
    if (!curPwd) {
      setPwdErr("Enter your current password.");
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      setPwdErr("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdErr("New passwords do not match.");
      return;
    }
    if (curPwd === newPwd) {
      setPwdErr("Choose a different new password.");
      return;
    }
    setPwdLoading(true);
    try {
      const r = await authFetch(`${getApiBase()}${apiPath.changePassword}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Could not change password");
      setPwdMsg("Password updated.");
      setCurPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdMsg(null), 3000);
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPwdLoading(false);
    }
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!stored?.id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setOk(null);
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be 5MB or less.");
      return;
    }
    try {
      setAvatarUploading(true);
      const uploaded = await uploadProfileImage(file);
      const row = await patchUser(stored.id, { profileImageFileId: uploaded.id });
      setU(row);
      setOk("Profile photo updated.");
      setTimeout(() => setOk(null), 2500);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Image upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  if (!stored?.id) {
    return (
      <div className="page-wrapper">
        <p style={{ color: "var(--gray-500)" }}>Not logged in.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <p style={{ color: "var(--gray-500)" }}>Loading…</p>
      </div>
    );
  }

  const initials = `${firstName[0] ?? "?"}${lastName[0] ?? ""}`.toUpperCase();
  const memberSince = u?.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : null;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your profile</h1>
          <p className="page-subtitle">Contact details and account security</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={saveProfile}>
          Save changes
        </button>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      {ok && <div className="card" style={{ color: "var(--success)", marginBottom: "1rem" }}>{ok}</div>}

      <div className="content-grid" style={{ alignItems: "start" }}>
        <div
          className="card"
          style={{
            padding: "1.75rem",
            background: "linear-gradient(160deg, #f5f3ff 0%, #fff 45%, #eef2ff 100%)",
            border: "1px solid #e9d5ff",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 1rem",
                border: "3px solid #ddd6fe",
              }}
            />
          ) : (
            <div className="avatar avatar-initials avatar-xl" style={{ margin: "0 auto 1rem", fontSize: "1.5rem", background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
              {initials}
            </div>
          )}
          <label style={{ display: "inline-flex", margin: "0 auto 0.75rem", cursor: avatarUploading ? "not-allowed" : "pointer" }}>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarSelected}
              disabled={avatarUploading}
              style={{ display: "none" }}
            />
            <span className="btn btn-secondary btn-sm">{avatarUploading ? "Uploading…" : "Upload photo"}</span>
          </label>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, textAlign: "center", margin: "0 0 0.35rem" }}>
            {firstName} {lastName}
          </h2>
          <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", textAlign: "center", margin: "0 0 0.75rem" }}>{u?.email}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "0.35rem 0.75rem",
                borderRadius: 999,
                background: "#ede9fe",
                color: "#5b21b6",
              }}
            >
              {roleLabel(stored.role ?? "admin")}
            </span>
            {memberSince && (
              <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>Member since {memberSince}</span>
            )}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginTop: "1.25rem", textAlign: "center", lineHeight: 1.5 }}>
            This is the account you use to manage the school. Keep your password private and update your phone so staff can reach you if needed.
          </p>
          <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <Link href="/admin/settings" className="btn btn-secondary" style={{ fontSize: "0.875rem" }}>
              School &amp; display settings
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "1rem" }}>
              Contact information
            </h3>
            <div style={{ display: "grid", gap: "0.85rem", maxWidth: 420 }}>
              <label>
                First name
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
              </label>
              <label>
                Last name
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
              </label>
              <label>
                Phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251…" style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
              </label>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "0.5rem" }}>
              Password
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", marginBottom: "1rem" }}>Use a strong password you do not use on other sites.</p>
            {pwdErr && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{pwdErr}</p>}
            {pwdMsg && <p style={{ color: "var(--success)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{pwdMsg}</p>}
            <form onSubmit={changePassword} style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}>
              <label>
                Current password
                <input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} autoComplete="current-password" style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
              </label>
              <label>
                New password
                <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
              </label>
              <label>
                Confirm new password
                <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }} />
              </label>
              <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                {pwdLoading ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
