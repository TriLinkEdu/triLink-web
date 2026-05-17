"use client";
import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

interface SafeHtmlProps {
    /** Untrusted HTML string (e.g. KaTeX output mixed with API-supplied content). */
    html: string;
    /**
     * Element to render. Use `span` for inline math, `div` for block.
     * Defaults to `span`.
     */
    as?: "span" | "div";
    /**
     * Extra DOMPurify config overrides. The defaults strip <script>, on* handlers,
     * <iframe>, and javascript: URLs while permitting KaTeX-style markup.
     */
    config?: Parameters<typeof DOMPurify.sanitize>[1];
    className?: string;
    style?: React.CSSProperties;
}

// KaTeX produces fairly rich markup (span trees, MathML, SVG). Allow it but lock
// down everything that can execute or navigate.
const DEFAULT_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
    USE_PROFILES: { html: true, mathMl: true, svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["style", "on*"],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
};

/**
 * Renders untrusted HTML safely. Wraps dangerouslySetInnerHTML so the call sites
 * are easy to grep and the DOMPurify config lives in one place.
 */
export function SafeHtml({ html, as = "span", config, className, style }: SafeHtmlProps) {
    const clean = useMemo(() => {
        if (!html) return "";
        const merged = config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;
        // DOMPurify in newer versions can return TrustedHTML; cast through unknown.
        return DOMPurify.sanitize(html, merged) as unknown as string;
    }, [html, config]);

    if (as === "div") {
        return (
            <div
                className={className}
                style={style}
                dangerouslySetInnerHTML={{ __html: clean }}
            />
        );
    }
    return (
        <span
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    );
}
