"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, patchUser, uploadProfileImage, type PublicUser } from "@/lib/admin-api";
import { authFetch, getStoredUser, setStoredUser } from "@/lib/auth";
import { apiPath, getApiBase } from "@/lib/api";
import AuthenticatedAvatar from "@/components/AuthenticatedAvatar";
import { useToastStore } from "@/store/toastStore";
import {
  Icon,
  KField,
  KitErrorBanner,
  KitInput,
  KitLoadingBlock,
  KitSpinner,
  PageHead,
  Pill,
} from "@/components/kit";

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
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
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

  const saveProfile = async () => {
    if (!stored?.id) return;
    setErr(null);
    try {
      const row = await patchUser(stored.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setU(row);
      // Sync localStorage so the Header re-renders with the updated name
      const current = getStoredUser();
      if (current) {
        setStoredUser({
          ...current,
          firstName: row.firstName,
          lastName: row.lastName,
        });
      }
      showToast("Profile updated successfully", "success", true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr(null);
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
      
      showToast("Password updated successfully", "success", true);
      setCurPwd("");
      setNewPwd("");
      setConfirmPwd("");
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
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be 5MB or less.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    try {
      setAvatarUploading(true);
      const uploaded = await uploadProfileImage(file);
      const row = await patchUser(stored.id, { profileImageFileId: uploaded.id });
      setU(row);
      // Sync localStorage so Header avatar in the top-right corner updates immediately
      const current = getStoredUser();
      if (current) {
        setStoredUser({
          ...current,
          profileImageFileId: uploaded.id,
        });
      }
      showToast("Profile photo updated successfully", "success", true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Image upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
    }
  };

  if (!stored?.id) {
    return (
      <div className="kit-page" data-role="admin">
        <KitErrorBanner message="Not logged in." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="kit-page" data-role="admin">
        <KitLoadingBlock label="Loading profile…" />
      </div>
    );
  }

  const initials = `${firstName[0] ?? "?"}${lastName[0] ?? ""}`.toUpperCase();
  const memberSince = u?.createdAt
    ? new Date(u.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="kit-page" data-role="admin">
      <PageHead
        meta={
          <>
            <span className="role-dot" />
            Account
            <span className="dot-sep">·</span>
            {u?.role ?? "admin"}
          </>
        }
        title="Your profile"
        sub="Contact details and account security."
        actions={
          <button type="button" className="btn-kit btn-kit-primary" onClick={saveProfile}>
            <Icon name="check" /> Save changes
          </button>
        }
      />
      {err && <KitErrorBanner message={err} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Identity card */}
        <div className="k-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                width={84}
                height={84}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid var(--color-hairline)",
                }}
              />
            ) : (
              <AuthenticatedAvatar
                fileId={u?.profileImageFileId}
                initials={initials}
                size={84}
                alt="Profile"
                style={{ border: "1px solid var(--color-hairline)" }}
              />
            )}
          </div>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <label
              style={{
                display: "inline-flex",
                cursor: avatarUploading ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarSelected}
                disabled={avatarUploading}
                style={{ display: "none" }}
              />
              <span className="btn-kit btn-kit-secondary">
                {avatarUploading ? (
                  <>
                    <KitSpinner size={11} /> Uploading…
                  </>
                ) : (
                  <>
                    <Icon name="upload" /> Upload photo
                  </>
                )}
              </span>
            </label>
          </div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.016em",
              textAlign: "center",
              margin: "0 0 2px",
              color: "var(--ink)",
            }}
          >
            {firstName} {lastName}
          </h2>
          <p
            style={{
              color: "var(--ink-2)",
              fontSize: 12.5,
              textAlign: "center",
              margin: "0 0 10px",
            }}
          >
            {u?.email}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <Pill kind="neutral">{roleLabel(stored.role ?? "admin")}</Pill>
            {memberSince && (
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                Member since {memberSince}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              margin: "0 0 14px",
              textAlign: "center",
              lineHeight: 1.55,
            }}
          >
            This is the account you use to manage the school. Keep your password private and
            update your phone so staff can reach you if needed.
          </p>
          <div style={{ textAlign: "center" }}>
            <Link href="/admin/settings" className="btn-kit btn-kit-ghost">
              <Icon name="settings" /> School &amp; display settings
            </Link>
          </div>
        </div>

        {/* Forms column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="k-card">
            <div className="k-card__head">
              <div className="k-card__title">Contact information</div>
              <div className="k-card__sub">Your name and phone shown to staff.</div>
            </div>
            <div
              className="k-card__body"
              style={{ display: "grid", gap: 10, maxWidth: 480 }}
            >
              <KField label="First name">
                <KitInput
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </KField>
              <KField label="Last name">
                <KitInput
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </KField>
              <KField label="Phone" hint="Use the international format, e.g. +251 911 234 567.">
                <KitInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 911 234 567"
                  autoComplete="tel"
                />
              </KField>
            </div>
          </div>

          <div className="k-card">
            <div className="k-card__head">
              <div className="k-card__title">Password</div>
              <div className="k-card__sub">
                Use a strong password you do not use on other sites.
              </div>
            </div>
            <form
              onSubmit={changePassword}
              className="k-card__body"
              style={{ display: "grid", gap: 10, maxWidth: 480 }}
            >
              {pwdErr && <KitErrorBanner message={pwdErr} />}
              <KField label="Current password">
                <KitInput
                  type="password"
                  value={curPwd}
                  onChange={(e) => setCurPwd(e.target.value)}
                  autoComplete="current-password"
                />
              </KField>
              <KField label="New password">
                <KitInput
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  autoComplete="new-password"
                />
              </KField>
              <KField label="Confirm new password">
                <KitInput
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"
                />
              </KField>
              <div>
                <button
                  type="submit"
                  className="btn-kit btn-kit-primary"
                  disabled={pwdLoading}
                  style={{ justifyContent: "center" }}
                >
                  {pwdLoading ? (
                    <>
                      <KitSpinner size={11} /> Updating…
                    </>
                  ) : (
                    <>
                      <Icon name="shield" /> Update password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
