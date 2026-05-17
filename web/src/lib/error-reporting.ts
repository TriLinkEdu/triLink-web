/**
 * Centralized client-side error reporting.
 *
 * Current implementation: console + optional POST to a reporting endpoint.
 *
 * Plan F follow-up: drop in `@sentry/nextjs`. Migration path:
 *   1. `npm i @sentry/nextjs`
 *   2. Replace the body of `reportError` with `Sentry.captureException(error, { extra })`.
 *   3. Run `npx @sentry/wizard@latest -i nextjs` for the build hooks.
 *
 * We keep this thin abstraction so all call sites (ErrorBoundary, authFetch,
 * SafeHtml, etc.) point at a single function and the eventual Sentry swap is a
 * one-file change.
 */

export interface ErrorContext {
    component?: string;
    componentStack?: string;
    [key: string]: unknown;
}

const REPORTING_ENDPOINT = (process.env.NEXT_PUBLIC_ERROR_REPORT_URL || "").trim();

export function reportError(error: unknown, context?: ErrorContext): void {
    const payload = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...context,
        href: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
    };

    // Always surface in dev so devs see the error without opening Sentry.
    if (process.env.NODE_ENV !== "production") {
        console.error("[reportError]", payload);
    }

    if (!REPORTING_ENDPOINT) return;
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    try {
        const body = JSON.stringify(payload);
        if (typeof navigator.sendBeacon === "function") {
            navigator.sendBeacon(REPORTING_ENDPOINT, new Blob([body], { type: "application/json" }));
            return;
        }
        // Fire-and-forget fetch fallback.
        void fetch(REPORTING_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
        });
    } catch {
        // Swallow: a failing reporter must never crash the app.
    }
}
