"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * Wraps next-themes so the existing `.dark` class hook on `<html>` flips the
 * Tailwind v4 dark theme tokens declared in globals.css.
 *
 * The TRILINK kit's warm off-white surface is the canonical look, so the
 * default theme is `light`. Users can opt in to system or dark via the
 * header's `<ThemeToggle/>` — their choice is persisted by next-themes.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
