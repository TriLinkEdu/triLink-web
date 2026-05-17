/**
 * Minimal in-tree i18n scaffold.
 *
 * The TriLink frontend has no third-party i18n library yet. This file lays out
 * the call shape (`t("namespace.key", { vars })`) so feature code can already
 * be written against it; a real implementation will swap the dictionary loader
 * to next-intl / react-i18next when product picks a stack.
 *
 * Keep keys flat — nested objects produce hard-to-grep call sites.
 */

import { useEffect, useState } from "react";

export type Locale = "en" | "am";
export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "am"];

type Dictionary = Record<string, string>;

const en: Dictionary = {
    "auth.login.title": "Welcome to TriLink",
    "auth.login.tagline": "Learn smarter, grow faster",
    "auth.login.submit": "Log in",
    "auth.login.submitting": "Logging in…",
    "auth.login.forgot": "Forgot password?",
    "auth.login.error.invalid": "Invalid email or password.",
    "common.action.retry": "Try again",
    "common.action.cancel": "Cancel",
    "common.action.save": "Save",
};

// Amharic placeholder strings — to be filled in by translators. Falls back to en
// transparently for any missing key.
const am: Dictionary = {};

const DICTIONARIES: Record<Locale, Dictionary> = { en, am };

export function t(
    key: string,
    vars?: Record<string, string | number>,
    locale: Locale = DEFAULT_LOCALE,
): string {
    const dict = DICTIONARIES[locale];
    const raw = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
        Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`,
    );
}

/**
 * Hook variant that re-renders when the locale changes. Today the locale
 * source is a localStorage key + a `trilink-locale` event; once next-intl or
 * similar is adopted this hook is the only call site to update.
 */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
    const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("trilink-locale") as Locale | null;
        if (stored && SUPPORTED_LOCALES.includes(stored)) setLocale(stored);
        const handler = (ev: Event) => {
            const next = (ev as CustomEvent<{ locale: Locale }>).detail?.locale;
            if (next && SUPPORTED_LOCALES.includes(next)) setLocale(next);
        };
        window.addEventListener("trilink-locale", handler);
        return () => window.removeEventListener("trilink-locale", handler);
    }, []);
    return (key, vars) => t(key, vars, locale);
}
