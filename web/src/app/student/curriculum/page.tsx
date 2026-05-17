"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles verbatim. */

/**
 * Student · Curriculum — a read-only adaptation of the kit's
 * `<CurriculumManager/>` tree. We reuse the same visual language so
 * students see the exact same subject/topic structure as the curriculum
 * team uses, without the editing affordances.
 */
import { useState } from "react";
import { Icon, PageHead, Pill } from "@/components/kit";

type TreeNode = { name: string; count?: number; n?: number; ai?: boolean; weak?: boolean; children?: TreeNode[] };

const TREE: TreeNode[] = [
    { name: "Calculus I", count: 12, ai: false, children: [
        { name: "Functions & Limits", count: 4, ai: true, children: [
            { name: "Functions & graphs",            n: 8 },
            { name: "Limits · direct substitution",  n: 6 },
            { name: "Limits · indeterminate forms",  n: 5, weak: true },
            { name: "Continuity",                    n: 7 },
        ]},
        { name: "Differentiation", count: 5, ai: true, children: [
            { name: "Power & sum rule",              n: 9 },
            { name: "Product & quotient rule",       n: 6 },
            { name: "Chain rule",                    n: 7, weak: true },
        ]},
    ]},
    { name: "Physics",       count: 9, children: [] },
    { name: "English Lit.",  count: 7, children: [] },
];

export default function StudentCurriculumPage() {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        "Calculus I": true,
        "Functions & Limits": true,
    });
    const toggle = (name: string) =>
        setExpanded((e) => ({ ...e, [name]: !e[name] }));

    const renderNode = (n: TreeNode, depth = 0): React.ReactNode => (
        <div key={n.name}>
            <div
                style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px",
                    paddingLeft: 14 + depth * 18,
                    borderBottom: "1px solid var(--hairline)",
                    cursor: n.children ? "pointer" : "default",
                }}
                onClick={() => n.children && toggle(n.name)}
                role={n.children ? "button" : undefined}
                tabIndex={n.children ? 0 : -1}
                onKeyDown={(e) => { if (n.children && e.key === "Enter") toggle(n.name); }}
            >
                {n.children ? (
                    <Icon name="chev" size={11} className={expanded[n.name] ? "rotate-90" : ""} />
                ) : (
                    <span style={{ width: 11 }} />
                )}
                {depth === 0 && <Icon name="book" size={14} className="text-[var(--ink-3)]" />}
                {depth >= 1 && (
                    <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: n.weak ? "var(--warning)" : "var(--ink-4)",
                    }} />
                )}
                <span style={{
                    fontSize: depth === 0 ? 13.5 : 13,
                    fontWeight: depth === 0 ? 500 : 400,
                    color: "var(--ink)",
                    letterSpacing: "-0.005em",
                    flex: 1,
                }}>
                    {n.name}
                </span>
                {n.ai && <Pill kind="brand"><Icon name="sparkles" size={10} /> AI</Pill>}
                {n.weak && <Pill kind="pending">Practice up</Pill>}
                <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 11,
                    color: "var(--ink-3)", fontVariantNumeric: "tabular-nums",
                }}>
                    {n.children ? `${n.count} topics` : `${n.n} resources`}
                </span>
            </div>
            {n.children && expanded[n.name] && n.children.map((c) => renderNode(c, depth + 1))}
        </div>
    );

    return (
        <div className="kit-page" data-role="student">
            <PageHead
                meta={<>Term <span className="dot-sep">·</span> 3 subjects · 23 topics</>}
                title="Your curriculum"
                sub="Subjects and topics you're studying this term."
            />
            <div className="k-card">
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">Topic tree</div>
                        <div className="k-card__sub">Click to expand · weak-topic dots are warm yellow</div>
                    </div>
                </div>
                <div>{TREE.map((n) => renderNode(n))}</div>
            </div>
        </div>
    );
}
