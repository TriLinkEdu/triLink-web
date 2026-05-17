"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/shadcn/button";

/**
 * Reset-password page — visually unified with `<LoginPage />`.
 *
 * The backend self-service reset endpoint is still pending (Plan F). Until it
 * ships, this surface explains what to do, but it now lives in the same
 * centered-card frame the login uses so the two flows feel like a pair.
 *
 * Once `POST /auth/reset-password` lands, this component should:
 *  - validate the `token` query param
 *  - render password + confirm fields (using <Input fieldSize="md"/>)
 *  - POST and surface success/error inline (using the kit alert styles)
 */
export function ResetPasswordClient() {
    const params = useSearchParams();
    const role = (params.get("role") || "student").toLowerCase();
    const roleClassMap: Record<string, string> = {
        student: "bg-[var(--color-role-student)]",
        teacher: "bg-[var(--color-role-teacher)]",
        admin: "bg-[var(--color-role-admin)]",
        parent: "bg-[var(--color-role-parent)]",
    };
    const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <div className="w-full max-w-[400px]">
            <div className="mb-7 flex flex-col items-center text-center">
                <Link
                    href="/"
                    aria-label="Back to portal selector"
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[12px] text-white no-underline transition-transform hover:-translate-y-px ${
                        roleClassMap[role] ?? "bg-[var(--color-ink)]"
                    }`}
                >
                    <GraduationCap size={22} strokeWidth={1.6} />
                </Link>
                <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-3)]">
                    {roleTitle} portal
                </p>
                <h1 className="m-0 mt-2 font-display text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-[var(--color-ink)]">
                    Reset your password.
                </h1>
                <p className="mt-1.5 max-w-[340px] text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
                    Self-service reset is currently disabled.
                </p>
            </div>

            <div className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 sm:p-7">
                <div className="rounded-[7px] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3.5 py-3 text-[12.5px] leading-[1.55] text-[var(--color-ink-2)]">
                    Ask your school&rsquo;s administrator to issue a fresh temporary
                    password. They can do this from the <strong className="font-medium text-[var(--color-ink)]">Admin · Users</strong> panel — you&rsquo;ll receive the new password by email.
                </div>

                <div className="mt-5 flex flex-col gap-2">
                    <Button asChild variant="primary" size="md" className="w-full">
                        <Link
                            href={`/${role}/login`}
                            className="inline-flex items-center justify-center gap-1.5"
                        >
                            <ArrowLeft size={14} strokeWidth={1.8} />
                            Back to {role} sign-in
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="w-full">
                        <Link href="/">Portal selector</Link>
                    </Button>
                </div>
            </div>

            <p className="mt-6 text-center text-[12px] text-[var(--color-ink-3)]">
                Need help? Email{" "}
                <a
                    href="mailto:support@trilink.edu"
                    className="font-medium text-[var(--color-ink-2)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
                >
                    support@trilink.edu
                </a>
                .
            </p>
        </div>
    );
}
