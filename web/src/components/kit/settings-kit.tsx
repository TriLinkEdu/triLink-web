"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * SettingsKitPage — real settings page wired to:
 *  - /api/me/settings  (user preferences: notifications, theme, locale, etc.)
 *  - /api/school/settings (admin-only, school-wide preferences)
 *
 * Sidebar nav actually swaps the visible pane, and edits dispatch real PATCH
 * requests through the admin-api wrappers.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
    Icon,
    KAvatar,
    PageHead,
    type KitIconName,
} from "@/components/kit";
import {
    KField,
    KitErrorBanner,
    KitInput,
    KitLoadingBlock,
    KitSelect,
    KitSpinner,
    KitToast,
} from "@/components/kit/local";
import {
    getSchoolSettings,
    getUserSettings,
    patchMe,
    patchSchoolSettings,
    patchUserSettings,
} from "@/lib/admin-api";

export type SettingsRole = "student" | "teacher" | "admin" | "parent";

type UserPrefs = {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    weeklyDigest?: boolean;
    theme?: "light" | "dark" | "system";
    locale?: string;
    timezone?: string;
};

type SchoolPrefs = {
    schoolName?: string;
    timezone?: string;
    schoolYearDisplay?: string;
    locale?: string;
    contactEmail?: string;
};

type Pane = "profile" | "notif" | "appearance" | "school" | "security";

interface SettingsKitPageProps {
    role: SettingsRole;
}

function parseSettings<T>(raw: unknown): T {
    if (!raw) return {} as T;
    if (typeof raw !== "object") return {} as T;
    const r = raw as Record<string, unknown>;
    const json = typeof r.settingsJson === "string" ? r.settingsJson : null;
    if (json) {
        try {
            return JSON.parse(json) as T;
        } catch {
            return {} as T;
        }
    }
    return r as T;
}

const TIMEZONE_OPTIONS = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Berlin",
    "Africa/Addis_Ababa",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
];

const THEME_OPTIONS: ReadonlyArray<UserPrefs["theme"]> = ["system", "light", "dark"];

export function SettingsKitPage({ role }: SettingsKitPageProps) {
    const user = useCurrentUser(role);
    const [pane, setPane] = useState<Pane>("profile");
    const [userPrefs, setUserPrefs] = useState<UserPrefs | null>(null);
    const [schoolPrefs, setSchoolPrefs] = useState<SchoolPrefs | null>(null);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<{ msg: string; tone?: "success" | "danger" } | null>(null);

    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");

    const showToast = useCallback((msg: string, tone: "success" | "danger" = "success") => {
        setToast({ msg, tone });
        window.setTimeout(() => setToast(null), 2400);
    }, []);

    useEffect(() => {
        setDisplayName(user.fullName || "");
        setPhone(user.phone || "");
    }, [user.fullName, user.phone]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const tasks: Array<Promise<unknown>> = [getUserSettings()];
                if (role === "admin") tasks.push(getSchoolSettings());
                const results = await Promise.all(tasks);
                if (cancelled) return;
                const u = parseSettings<UserPrefs>(results[0]);
                setUserPrefs(u);
                if (role === "admin") {
                    const s = parseSettings<SchoolPrefs>(results[1]);
                    setSchoolPrefs(s);
                }
            } catch (e) {
                if (!cancelled) {
                    setLoadErr(e instanceof Error ? e.message : "Failed to load settings");
                    setUserPrefs({});
                    setSchoolPrefs({});
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [role]);

    const NAV_ITEMS = useMemo(() => {
        const items: Array<[Pane, string, KitIconName]> = [
            ["profile", "Profile", "user"],
            ["notif", "Notifications", "bell"],
            ["appearance", "Appearance", "sun"],
        ];
        if (role === "admin") items.push(["school", "School", "cog"]);
        items.push(["security", "Security", "shield"]);
        return items;
    }, [role]);

    const setUserPref = (patch: Partial<UserPrefs>) =>
        setUserPrefs((prev) => ({ ...(prev ?? {}), ...patch }));

    const setSchoolPref = (patch: Partial<SchoolPrefs>) =>
        setSchoolPrefs((prev) => ({ ...(prev ?? {}), ...patch }));

    const onSaveProfile = async () => {
        setBusy(true);
        try {
            const parts = displayName.trim().split(/\s+/);
            const firstName = parts[0] || user.firstName || "";
            const lastName = parts.slice(1).join(" ") || user.lastName || "";
            await patchMe({ firstName, lastName, phone: phone || undefined });
            showToast("Profile saved");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Save failed", "danger");
        } finally {
            setBusy(false);
        }
    };

    const onSaveUserPrefs = async () => {
        if (!userPrefs) return;
        setBusy(true);
        try {
            await patchUserSettings(JSON.stringify(userPrefs));
            showToast("Preferences saved");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Save failed", "danger");
        } finally {
            setBusy(false);
        }
    };

    const onSaveSchoolPrefs = async () => {
        if (!schoolPrefs) return;
        setBusy(true);
        try {
            await patchSchoolSettings(JSON.stringify(schoolPrefs));
            showToast("School settings saved");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Save failed", "danger");
        } finally {
            setBusy(false);
        }
    };

    const initials = user.initials || (displayName || "U").slice(0, 2).toUpperCase();
    const isLoading = userPrefs == null || (role === "admin" && schoolPrefs == null);

    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Settings
                    </>
                }
                title="Preferences"
                sub="Manage your profile, notifications, and account preferences."
            />

            {loadErr && <KitErrorBanner message={loadErr} />}

            <div
                style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 18 }}
                className="settings-kit-grid"
            >
                <aside>
                    {NAV_ITEMS.map(([id, label, ico]) => (
                        <button
                            type="button"
                            key={id}
                            onClick={() => setPane(id)}
                            className={`sidebar__item ${pane === id ? "active" : ""}`}
                            style={{ marginBottom: 1, width: "100%" }}
                        >
                            <Icon name={ico} />
                            {label}
                        </button>
                    ))}
                </aside>

                <div className="section-stack" style={{ display: "grid", gap: 14 }}>
                    {isLoading ? (
                        <KitLoadingBlock label="Loading settings…" />
                    ) : pane === "profile" ? (
                        <div className="k-card">
                            <div className="k-card__head">
                                <div>
                                    <div className="k-card__title">Profile</div>
                                    <div className="k-card__sub">How you appear across TriLink</div>
                                </div>
                            </div>
                            <div
                                className="k-card__body"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 1fr",
                                    gap: 24,
                                    alignItems: "start",
                                }}
                            >
                                <KAvatar initials={initials} size="xl" tone="filled" />
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 12,
                                    }}
                                >
                                    <KField label="Full name" required>
                                        <KitInput
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                        />
                                    </KField>
                                    <KField label="Email" hint="Email is managed by the school administrator">
                                        <KitInput value={user.email || ""} disabled readOnly />
                                    </KField>
                                    <KField label="Phone">
                                        <KitInput
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 555 123 4567"
                                        />
                                    </KField>
                                    <KField label="Role" hint="Set when your account was created">
                                        <KitInput value={role} disabled readOnly />
                                    </KField>
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: "12px 18px",
                                    borderTop: "1px solid var(--color-hairline)",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn-kit btn-kit-primary"
                                    onClick={onSaveProfile}
                                    disabled={busy}
                                >
                                    {busy ? <KitSpinner size={12} /> : <Icon name="check" />} Save profile
                                </button>
                            </div>
                        </div>
                    ) : pane === "notif" ? (
                        <div className="k-card">
                            <div className="k-card__head">
                                <div>
                                    <div className="k-card__title">Notifications</div>
                                    <div className="k-card__sub">Where and how we ping you</div>
                                </div>
                            </div>
                            <div style={{ padding: "6px 0" }}>
                                <ToggleRow
                                    label="Email notifications"
                                    hint="Get the important stuff sent to your inbox"
                                    value={userPrefs?.emailNotifications ?? true}
                                    onChange={(v) => setUserPref({ emailNotifications: v })}
                                />
                                <ToggleRow
                                    label="Push notifications"
                                    hint="In-app + browser pushes for urgent items"
                                    value={userPrefs?.pushNotifications ?? true}
                                    onChange={(v) => setUserPref({ pushNotifications: v })}
                                />
                                <ToggleRow
                                    label="Weekly digest"
                                    hint="Friday afternoon, one summary email"
                                    value={userPrefs?.weeklyDigest ?? false}
                                    onChange={(v) => setUserPref({ weeklyDigest: v })}
                                />
                            </div>
                            <div
                                style={{
                                    padding: "12px 18px",
                                    borderTop: "1px solid var(--color-hairline)",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn-kit btn-kit-primary"
                                    onClick={onSaveUserPrefs}
                                    disabled={busy}
                                >
                                    {busy ? <KitSpinner size={12} /> : <Icon name="check" />} Save notifications
                                </button>
                            </div>
                        </div>
                    ) : pane === "appearance" ? (
                        <div className="k-card">
                            <div className="k-card__head">
                                <div>
                                    <div className="k-card__title">Appearance</div>
                                    <div className="k-card__sub">Theme and locale</div>
                                </div>
                            </div>
                            <div
                                className="k-card__body"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                }}
                            >
                                <KField label="Theme">
                                    <KitSelect
                                        value={userPrefs?.theme ?? "system"}
                                        onChange={(e) =>
                                            setUserPref({ theme: e.target.value as UserPrefs["theme"] })
                                        }
                                    >
                                        {THEME_OPTIONS.map((t) => (
                                            <option key={t} value={t}>
                                                {(t ?? "system")
                                                    .replace(/^./, (c) => c.toUpperCase())}
                                            </option>
                                        ))}
                                    </KitSelect>
                                </KField>
                                <KField label="Timezone">
                                    <KitSelect
                                        value={userPrefs?.timezone ?? "UTC"}
                                        onChange={(e) =>
                                            setUserPref({ timezone: e.target.value })
                                        }
                                    >
                                        {TIMEZONE_OPTIONS.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))}
                                    </KitSelect>
                                </KField>
                                <KField label="Locale" hint="Display language. Falls back to English where translations are missing.">
                                    <KitInput
                                        value={userPrefs?.locale ?? "en"}
                                        onChange={(e) => setUserPref({ locale: e.target.value })}
                                    />
                                </KField>
                            </div>
                            <div
                                style={{
                                    padding: "12px 18px",
                                    borderTop: "1px solid var(--color-hairline)",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn-kit btn-kit-primary"
                                    onClick={onSaveUserPrefs}
                                    disabled={busy}
                                >
                                    {busy ? <KitSpinner size={12} /> : <Icon name="check" />} Save appearance
                                </button>
                            </div>
                        </div>
                    ) : pane === "school" && role === "admin" ? (
                        <div className="k-card">
                            <div className="k-card__head">
                                <div>
                                    <div className="k-card__title">School</div>
                                    <div className="k-card__sub">Identity and locale for the whole school</div>
                                </div>
                            </div>
                            <div
                                className="k-card__body"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                }}
                            >
                                <KField label="School name" required>
                                    <KitInput
                                        value={schoolPrefs?.schoolName ?? ""}
                                        onChange={(e) => setSchoolPref({ schoolName: e.target.value })}
                                    />
                                </KField>
                                <KField label="School year display" hint="Shown in headers, e.g. '2025–2026'">
                                    <KitInput
                                        value={schoolPrefs?.schoolYearDisplay ?? ""}
                                        onChange={(e) => setSchoolPref({ schoolYearDisplay: e.target.value })}
                                    />
                                </KField>
                                <KField label="Timezone">
                                    <KitSelect
                                        value={schoolPrefs?.timezone ?? "UTC"}
                                        onChange={(e) => setSchoolPref({ timezone: e.target.value })}
                                    >
                                        {TIMEZONE_OPTIONS.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))}
                                    </KitSelect>
                                </KField>
                                <KField label="Contact email">
                                    <KitInput
                                        type="email"
                                        value={schoolPrefs?.contactEmail ?? ""}
                                        onChange={(e) => setSchoolPref({ contactEmail: e.target.value })}
                                    />
                                </KField>
                            </div>
                            <div
                                style={{
                                    padding: "12px 18px",
                                    borderTop: "1px solid var(--color-hairline)",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn-kit btn-kit-primary"
                                    onClick={onSaveSchoolPrefs}
                                    disabled={busy}
                                >
                                    {busy ? <KitSpinner size={12} /> : <Icon name="check" />} Save school
                                </button>
                            </div>
                        </div>
                    ) : pane === "security" ? (
                        <div className="k-card">
                            <div className="k-card__head">
                                <div>
                                    <div className="k-card__title">Security</div>
                                    <div className="k-card__sub">Account security and access</div>
                                </div>
                            </div>
                            <div style={{ padding: "6px 6px" }}>
                                <SecurityRow
                                    icon="lock"
                                    label="Change password"
                                    hint="Set a new password for your account"
                                    href={`/${role}/profile`}
                                />
                                <SecurityRow
                                    icon="shield"
                                    label="Two-factor authentication"
                                    hint="Coming soon"
                                    disabled
                                />
                                <SecurityRow
                                    icon="history"
                                    label="Active sessions"
                                    hint="Coming soon — single session per device for now"
                                    disabled
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {toast && <KitToast message={toast.msg} tone={toast.tone} />}
        </div>
    );
}

function ToggleRow({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-hairline)",
            }}
        >
            <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{hint}</div>
            </div>
            <button
                type="button"
                className={`toggle ${value ? "on" : ""}`}
                onClick={() => onChange(!value)}
                aria-pressed={value}
                aria-label={label}
            />
        </div>
    );
}

function SecurityRow({
    icon,
    label,
    hint,
    href,
    disabled,
}: {
    icon: KitIconName;
    label: string;
    hint?: string;
    href?: string;
    disabled?: boolean;
}) {
    const inner = (
        <>
            <Icon name={icon} className="lead" />
            <span style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                {hint && (
                    <span
                        style={{
                            display: "block",
                            fontSize: 11.5,
                            color: "var(--ink-3)",
                            marginTop: 2,
                        }}
                    >
                        {hint}
                    </span>
                )}
            </span>
            {!disabled && <Icon name="chev" className="chev" />}
        </>
    );

    if (disabled || !href) {
        return (
            <div
                className="qa"
                style={{
                    opacity: disabled ? 0.6 : 1,
                    cursor: "default",
                    pointerEvents: disabled ? "none" : "auto",
                }}
            >
                {inner}
            </div>
        );
    }
    return (
        <a href={href} className="qa">
            {inner}
        </a>
    );
}
