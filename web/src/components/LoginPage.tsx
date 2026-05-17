"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, GraduationCap } from "lucide-react";
import { refreshStoredProfile, setTokens, setStoredUser } from "@/lib/auth";
import { apiPath, getApiBase } from "@/lib/api";
import { Button, Input, Label } from "@/components/shadcn";

type PortalRole = "admin" | "teacher" | "student" | "parent";

interface LoginPageProps {
    role: string;
    rolePlural: string;
    dashboardPath: string;
    /** @deprecated kept for compatibility — no longer rendered. The login
     * screen is now a single centered card across all roles. */
    gradient?: string;
    /** Optional one-line role tagline. Keep it under ~70 characters. */
    tagline?: string;
}

const OTHER_ROLES: Record<PortalRole, { label: string; href: string }[]> = {
    admin: [
        { label: "Teacher", href: "/teacher/login" },
        { label: "Student", href: "/student/login" },
        { label: "Parent", href: "/parent/login" },
    ],
    teacher: [
        { label: "Admin", href: "/admin/login" },
        { label: "Student", href: "/student/login" },
        { label: "Parent", href: "/parent/login" },
    ],
    student: [
        { label: "Admin", href: "/admin/login" },
        { label: "Teacher", href: "/teacher/login" },
        { label: "Parent", href: "/parent/login" },
    ],
    parent: [
        { label: "Admin", href: "/admin/login" },
        { label: "Teacher", href: "/teacher/login" },
        { label: "Student", href: "/student/login" },
    ],
};

export default function LoginPage({
    role,
    dashboardPath,
    tagline,
}: LoginPageProps) {
    const forgotPasswordEnabled =
        process.env.NEXT_PUBLIC_ENABLE_FORGOT_PASSWORD === "true";
    const canUseForgotPassword =
        forgotPasswordEnabled && role.toLowerCase() !== "admin";
    const normalizedRole = role.toLowerCase() as PortalRole;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [resetMessage, setResetMessage] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetting, setResetting] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        if (!email || !password) {
            setLoginError("Enter your email and password to continue.");
            return;
        }

        setLoading(true);
        try {
            const apiBase = getApiBase();
            const loginPath = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH ?? apiPath.login;
            const res = await fetch(`${apiBase}${loginPath}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    password,
                    role: role.toLowerCase(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    data.message ||
                        "We couldn’t find an account with those details.",
                );
            }
            if (data.accessToken) setTokens(data.accessToken, data.refreshToken);
            if (data.user ?? data.id ?? data.firstName) {
                const u = data.user ?? data;
                setStoredUser({
                    id: u.id,
                    firstName: u.firstName ?? "",
                    lastName: u.lastName ?? "",
                    email: u.email ?? email.toLowerCase(),
                    role: (u.role ?? role).toLowerCase(),
                    grade: u.grade,
                    section: u.section,
                    subject: u.subject,
                    department: u.department,
                    childName: u.childName,
                    relationship: u.relationship,
                    profileImageFileId:
                        u.profileImageFileId ||
                        data.profileImageFileId ||
                        data.profileImageId ||
                        data.avatarId,
                });
            } else {
                setStoredUser({
                    firstName: "",
                    lastName: "",
                    email: email.toLowerCase(),
                    role: role.toLowerCase(),
                });
            }
            await refreshStoredProfile();
            router.push(dashboardPath);
        } catch (err) {
            setLoginError(
                err instanceof Error
                    ? err.message
                    : "Sign-in failed. Please try again.",
            );
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError("");
        setResetMessage("");
        if (!forgotEmail) {
            setResetError("Enter your email address.");
            return;
        }
        setResetting(true);
        try {
            const resetPayload = {
                emailType: "reset-password",
                to: forgotEmail.toLowerCase(),
                role: normalizedRole,
                resetLink: `${window.location.origin}/reset-password?email=${encodeURIComponent(forgotEmail.toLowerCase())}&role=${normalizedRole}`,
            };
            const res = await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resetPayload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "We couldn’t send the reset email.");
            }
            setResetMessage(
                `Reset instructions sent to ${forgotEmail}.`,
            );
            setForgotEmail("");
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetMessage("");
            }, 3000);
        } catch (err) {
            setResetError(
                err instanceof Error ? err.message : "Something went wrong.",
            );
        } finally {
            setResetting(false);
        }
    };

    const otherRoles = OTHER_ROLES[normalizedRole] ?? [];
    const roleTitle = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const roleClassMap: Record<PortalRole, string> = {
        student: "bg-[var(--color-role-student)]",
        teacher: "bg-[var(--color-role-teacher)]",
        admin: "bg-[var(--color-role-admin)]",
        parent: "bg-[var(--color-role-parent)]",
    };

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-[var(--color-bg)] px-4 py-10">
            <div className="w-full max-w-[400px]">
                <div className="mb-7 flex flex-col items-center text-center">
                    <Link
                        href="/"
                        aria-label="Back to portal selector"
                        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[12px] text-white no-underline transition-transform hover:-translate-y-px ${
                            roleClassMap[normalizedRole] ??
                            "bg-[var(--color-ink)]"
                        }`}
                    >
                        <GraduationCap size={22} strokeWidth={1.6} />
                    </Link>
                    <p className="m-0 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-3)]">
                        <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                                roleClassMap[normalizedRole] ?? "bg-[var(--color-ink)]"
                            }`}
                            aria-hidden
                        />
                        {roleTitle} portal
                    </p>
                    <h1 className="m-0 mt-2 font-display text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-[var(--color-ink)]">
                        Sign in to TriLink
                        <span
                            style={{
                                fontFamily: "var(--font-serif)",
                                fontStyle: "italic",
                                color: "var(--brand)",
                            }}
                        >
                            .
                        </span>
                    </h1>
                    <p className="mt-1.5 max-w-[320px] text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
                        {tagline ||
                            `Use your school-issued ${roleTitle.toLowerCase()} email and password to continue.`}
                    </p>
                </div>

                <div className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 sm:p-7">
                    {!showForgotPassword || !canUseForgotPassword ? (
                        <form onSubmit={handleLogin} noValidate className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="login-email" className="text-xs font-medium">
                                    Email
                                </Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="name@school.edu"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (loginError) setLoginError("");
                                    }}
                                    disabled={loading}
                                    leadingIcon={<Mail />}
                                    invalid={!!loginError && !email}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="login-password" className="text-xs font-medium">
                                        Password
                                    </Label>
                                    {canUseForgotPassword ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs text-[var(--color-fg-muted)] underline-offset-2 hover:text-[var(--color-fg)] hover:underline"
                                        >
                                            Forgot?
                                        </button>
                                    ) : null}
                                </div>
                                <Input
                                    id="login-password"
                                    type={showPwd ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (loginError) setLoginError("");
                                    }}
                                    disabled={loading}
                                    leadingIcon={<Lock />}
                                    invalid={!!loginError && !password}
                                    trailingSlot={
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd((v) => !v)}
                                            disabled={loading}
                                            aria-label={
                                                showPwd ? "Hide password" : "Show password"
                                            }
                                            className="rounded p-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                                        >
                                            {showPwd ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    }
                                />
                            </div>

                            {loginError ? (
                                <div
                                    role="alert"
                                    className="rounded-[7px] border bg-[var(--color-danger-soft)] px-3 py-2 text-[12.5px] leading-[1.4] text-[var(--color-danger)]"
                                    style={{ borderColor: "rgba(196,53,84,0.18)" }}
                                >
                                    {loginError}
                                </div>
                            ) : null}

                            <Button
                                type="submit"
                                size="md"
                                variant="primary"
                                className="w-full"
                                loading={loading}
                            >
                                Sign in
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="rounded-[7px] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 text-[12.5px] leading-[1.45] text-[var(--color-ink-2)]">
                                Enter your email and we&rsquo;ll send you a reset link.
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="forgot-email" className="text-xs font-medium">
                                    Email
                                </Label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="name@school.edu"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    disabled={resetting}
                                    leadingIcon={<Mail />}
                                />
                            </div>
                            {resetError ? (
                                <div
                                    role="alert"
                                    className="rounded-[7px] border bg-[var(--color-danger-soft)] px-3 py-2 text-[12.5px] leading-[1.4] text-[var(--color-danger)]"
                                    style={{ borderColor: "rgba(196,53,84,0.18)" }}
                                >
                                    {resetError}
                                </div>
                            ) : null}
                            {resetMessage ? (
                                <div
                                    role="status"
                                    className="rounded-[7px] border bg-[var(--color-success-soft)] px-3 py-2 text-[12.5px] leading-[1.4] text-[var(--color-success)]"
                                    style={{ borderColor: "rgba(13,138,95,0.18)" }}
                                >
                                    {resetMessage}
                                </div>
                            ) : null}
                            <Button type="submit" size="md" variant="primary" className="w-full" loading={resetting}>
                                Send reset link
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setForgotEmail("");
                                    setResetError("");
                                    setResetMessage("");
                                }}
                            >
                                Back to sign in
                            </Button>
                        </form>
                    )}
                </div>

                {otherRoles.length > 0 ? (
                    <div className="mt-6 text-center text-[12px] text-[var(--color-ink-3)]">
                        Not a {roleTitle.toLowerCase()}?{" "}
                        {otherRoles.map((r, i) => (
                            <span key={r.href}>
                                <Link
                                    href={r.href}
                                    className="font-medium text-[var(--color-ink-2)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
                                >
                                    Sign in as {r.label.toLowerCase()}
                                </Link>
                                {i < otherRoles.length - 1 ? (
                                    <span className="mx-1.5 text-[var(--color-ink-4)]" aria-hidden>
                                        ·
                                    </span>
                                ) : null}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        </main>
    );
}
