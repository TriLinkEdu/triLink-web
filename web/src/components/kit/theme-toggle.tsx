"use client";

/**
 * KitThemeToggle — 3-state theme picker styled to match the TRILINK kit's
 * `.iconbtn` (compact 28×28, hairline-bordered popover).
 *
 * Cycles light → dark → system → light to keep the click target minimal
 * while still exposing all three options. The kit's design language uses
 * a single sun/moon affordance in the header, so the icon switches based
 * on the resolved theme; long-press / right-click shows a labelled menu
 * via the dropdown for explicit picking.
 */
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

export function KitThemeToggle({ className = "" }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        }
        if (open) {
            window.addEventListener("mousedown", onClickOutside);
            return () => window.removeEventListener("mousedown", onClickOutside);
        }
    }, [open]);

    if (!mounted) {
        return (
            <button type="button" className={`iconbtn ${className}`.trim()} aria-label="Toggle theme" disabled>
                <Icon name="sun" />
            </button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                type="button"
                className={`iconbtn ${className}`.trim()}
                aria-label="Theme settings"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                title="Theme"
            >
                <Icon name={isDark ? "moon" : "sun"} />
            </button>
            {open ? (
                <div
                    role="menu"
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 6px)",
                        zIndex: 50,
                        background: "var(--surface)",
                        border: "1px solid var(--hairline)",
                        borderRadius: 10,
                        padding: 4,
                        minWidth: 160,
                        boxShadow: "var(--shadow-pop)",
                    }}
                >
                    {(["light", "dark", "system"] as const).map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            role="menuitemradio"
                            aria-checked={theme === opt}
                            onClick={() => {
                                setTheme(opt);
                                setOpen(false);
                            }}
                            className="qa"
                            style={{ width: "100%" }}
                        >
                            <Icon
                                name={opt === "light" ? "sun" : opt === "dark" ? "moon" : "laptop"}
                                className="lead"
                            />
                            <span style={{ textTransform: "capitalize" }}>{opt}</span>
                            {theme === opt ? <Icon name="check" className="chev" /> : <span className="chev" />}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
