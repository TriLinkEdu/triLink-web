"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  activateAcademicYear,
  getSchoolSettings,
  getUserSettings,
  listAcademicYears,
  patchSchoolSettings,
  patchUserSettings,
  type AcademicYear,
} from "@/lib/admin-api";

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const o = JSON.parse(raw && raw.trim() ? raw : "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default function AdminSettings() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [schoolDisplayName, setSchoolDisplayName] = useState("");
  const [schoolTimezone, setSchoolTimezone] = useState("");
  const [schoolSupportEmail, setSchoolSupportEmail] = useState("");
  const [schoolDateFormat, setSchoolDateFormat] = useState("mdy");
  const [schoolBlob, setSchoolBlob] = useState<Record<string, unknown>>({});

  const [prefTheme, setPrefTheme] = useState<"light" | "dark" | "system">("system");
  const [prefCompactTables, setPrefCompactTables] = useState(false);
  const [userBlob, setUserBlob] = useState<Record<string, unknown>>({});

  const load = async () => {
    setErr(null);
    try {
      const [school, me, y] = await Promise.all([getSchoolSettings(), getUserSettings(), listAcademicYears()]);
      const s = school as { settingsJson?: string };
      const m = me as { settingsJson?: string };
      const sObj = parseJsonObject(s.settingsJson ?? "{}");
      setSchoolBlob(sObj);
      setSchoolDisplayName(String(sObj.displayName ?? sObj.schoolName ?? ""));
      setSchoolTimezone(String(sObj.timezone ?? ""));
      setSchoolSupportEmail(String(sObj.supportEmail ?? ""));
      setSchoolDateFormat(String(sObj.dateFormat ?? "mdy") === "dmy" ? "dmy" : "mdy");

      const uObj = parseJsonObject(m.settingsJson ?? "{}");
      setUserBlob(uObj);
      const th = uObj.theme;
      setPrefTheme(th === "dark" || th === "light" ? th : "system");
      setPrefCompactTables(Boolean(uObj.compactTables));

      setYears(y);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSchool = async () => {
    setErr(null);
    setMsg(null);
    try {
      const next: Record<string, unknown> = { ...schoolBlob };
      const dn = schoolDisplayName.trim();
      const tz = schoolTimezone.trim();
      const se = schoolSupportEmail.trim();
      if (dn) next.displayName = dn;
      else delete next.displayName;
      if (tz) next.timezone = tz;
      else delete next.timezone;
      if (se) next.supportEmail = se;
      else delete next.supportEmail;
      next.dateFormat = schoolDateFormat;
      await patchSchoolSettings(JSON.stringify(next));
      setSchoolBlob(next);
      setMsg("School settings saved.");
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const saveMe = async () => {
    setErr(null);
    setMsg(null);
    try {
      const next = {
        ...userBlob,
        theme: prefTheme,
        compactTables: prefCompactTables,
      };
      await patchUserSettings(JSON.stringify(next));
      setUserBlob(next);
      setMsg("Your preferences saved.");
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const activate = async (id: string) => {
    try {
      await activateAcademicYear(id);
      setYears(await listAcademicYears());
      setMsg("Active year updated.");
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Activate failed");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">School-wide defaults, your preferences, and the active academic year</p>
        </div>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</div>}
      {msg && <div className="card" style={{ color: "var(--success)", marginBottom: "1rem" }}>{msg}</div>}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title" style={{ marginBottom: "0.75rem" }}>
          Academic year
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", marginBottom: "0.75rem" }}>
          Create years, terms, grades, and subjects under{" "}
          <Link href="/admin/school-setup" style={{ fontWeight: 600 }}>
            School setup
          </Link>
          . Choose which year is active for day-to-day work.
        </p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {years.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: "var(--gray-500)" }}>
                    No academic years yet.
                  </td>
                </tr>
              ) : (
                years.map((y) => (
                  <tr key={y.id}>
                    <td>{y.label}</td>
                    <td>{y.isActive ? "Yes" : "No"}</td>
                    <td>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => activate(y.id)}>
                        Set active
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title" style={{ marginBottom: "0.75rem" }}>
          School profile
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", marginBottom: "1rem" }}>
          Shown in communications and reports. Only administrators can change these.
        </p>
        <div style={{ display: "grid", gap: "1rem", maxWidth: 480 }}>
          <label>
            School name
            <input
              value={schoolDisplayName}
              onChange={(e) => setSchoolDisplayName(e.target.value)}
              placeholder="e.g. Lincoln High School"
              style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
            />
          </label>
          <label>
            Support email (optional)
            <input
              type="email"
              value={schoolSupportEmail}
              onChange={(e) => setSchoolSupportEmail(e.target.value)}
              placeholder="office@school.edu"
              style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
            />
          </label>
          <label>
            Timezone (optional)
            <input
              value={schoolTimezone}
              onChange={(e) => setSchoolTimezone(e.target.value)}
              placeholder="e.g. Africa/Addis_Ababa"
              style={{ display: "block", width: "100%", marginTop: 6, padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--gray-200)" }}
            />
          </label>
          <label>
            Date format
            <select
              value={schoolDateFormat}
              onChange={(e) => setSchoolDateFormat(e.target.value)}
              style={{ display: "block", width: "100%", maxWidth: 280, marginTop: 6, padding: "0.5rem" }}
            >
              <option value="mdy">Month / day / year (US-style)</option>
              <option value="dmy">Day / month / year</option>
            </select>
          </label>
          <button type="button" className="btn btn-primary" onClick={saveSchool}>
            Save school profile
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: "0.75rem" }}>
          Your admin preferences
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", marginBottom: "1rem" }}>
          These apply only to your account in this browser experience.
        </p>
        <div style={{ display: "grid", gap: "1rem", maxWidth: 480 }}>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Theme</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {(
                [
                  ["light", "Light"],
                  ["dark", "Dark"],
                  ["system", "Match device"],
                ] as const
              ).map(([v, label]) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="radio" name="theme" checked={prefTheme === v} onChange={() => setPrefTheme(v)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={prefCompactTables} onChange={(e) => setPrefCompactTables(e.target.checked)} />
            Use compact tables (smaller rows in lists)
          </label>
          <button type="button" className="btn btn-primary" onClick={saveMe}>
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
