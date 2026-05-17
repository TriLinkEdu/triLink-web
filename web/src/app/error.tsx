"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportError } from "@/lib/error-reporting";

/**
 * App-wide error boundary. Catches render errors that escape per-segment
 * error.tsx files and forwards them to the reporter shim (Plan F).
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        reportError(error, { component: "app/error.tsx", digest: error.digest });
    }, [error]);

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
                background: "var(--gray-50, #f8fafc)",
            }}
        >
            <div
                style={{
                    maxWidth: 480,
                    width: "100%",
                    background: "#fff",
                    borderRadius: 16,
                    padding: "2rem",
                    boxShadow: "0 6px 24px rgba(15,23,42,0.06)",
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--danger-600, #b91c1c)",
                    }}
                >
                    Something went wrong
                </p>
                <h1
                    style={{
                        margin: "0.5rem 0 1rem",
                        fontSize: "1.5rem",
                        color: "var(--gray-900, #0f172a)",
                    }}
                >
                    We hit an unexpected error
                </h1>
                <p style={{ margin: "0 0 1.5rem", color: "var(--gray-600, #475569)" }}>
                    The page failed to render. You can try again or go back home.
                    {error.digest ? (
                        <>
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "var(--gray-400, #94a3b8)" }}>
                                Ref: {error.digest}
                            </span>
                        </>
                    ) : null}
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                    <button
                        type="button"
                        onClick={() => reset()}
                        style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: 10,
                            border: "1px solid var(--primary-600, #2563eb)",
                            background: "var(--primary-600, #2563eb)",
                            color: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: 10,
                            border: "1px solid var(--gray-200, #e2e8f0)",
                            color: "var(--gray-700, #334155)",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </main>
    );
}
