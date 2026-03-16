"use client";
import { useState, useCallback, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useExamStore } from "@/store/examStore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createPortal } from "react-dom";

/* ─── Natural notation → LaTeX (so teachers don't need to know LaTeX syntax) ─── */
function preprocess(tex: string): string {
    let out = tex;
    // sqrt(expr) → \sqrt{expr}
    out = out.replace(/\bsqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}');
    // (a)/(b) → \frac{a}{b}  (parenthesized fractions)
    out = out.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
    // Greek letter words  (only plain words, not already \-prefixed)
    const greek: [RegExp, string][] = [
        [/(?<!\\)\balpha\b/g,'\\alpha'],  [/(?<!\\)\bbeta\b/g,'\\beta'],
        [/(?<!\\)\bgamma\b/g,'\\gamma'],  [/(?<!\\)\bdelta\b/g,'\\delta'],
        [/(?<!\\)\btheta\b/g,'\\theta'],  [/(?<!\\)\blambda\b/g,'\\lambda'],
        [/(?<!\\)\bmu\b/g,'\\mu'],        [/(?<!\\)\bpi\b/g,'\\pi'],
        [/(?<!\\)\bsigma\b/g,'\\sigma'],  [/(?<!\\)\bphi\b/g,'\\phi'],
        [/(?<!\\)\bomega\b/g,'\\omega'],  [/(?<!\\)\bDelta\b/g,'\\Delta'],
        [/\binfinity\b/gi,'\\infty'],      [/(?<!\\)\binf\b/g,'\\infty'],
    ];
    for (const [re, rep] of greek) out = out.replace(re, rep);
    // Common shorthand operators
    out = out
        .replace(/(?<!\\)>=/g, '\\geq ')
        .replace(/(?<!\\)<=/g, '\\leq ')
        .replace(/(?<!\\)!=/g, '\\neq ')
        .replace(/(?<!\\)<->/g, '\\leftrightarrow ')
        .replace(/(?<!\\)->/g, '\\rightarrow ')
        .replace(/(?<![\\A-Za-z])\+-/g, '\\pm ');
    return out;
}

/* ─── Render LaTeX ─── */
function renderLatex(raw: string): string {
    if (!raw) return "";
    let out = raw.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
        try { return katex.renderToString(preprocess(tex.trim()), { displayMode: true, throwOnError: false }); }
        catch { return `<code>$$${tex}$$</code>`; }
    });
    out = out.replace(/\$([^\n$]+?)\$/g, (_m, tex) => {
        try { return katex.renderToString(preprocess(tex.trim()), { displayMode: false, throwOnError: false }); }
        catch { return `<code>$${tex}$</code>`; }
    });
    return out.replace(/\n/g, "<br />");
}

/* ─── Snippet data (pre-render KaTeX at module load for performance) ─── */
type Snippet = { display: string; insert: string; tip: string };

function preRender(items: Snippet[]) {
    return items.map(item => {
        let html = item.display;
        try { html = katex.renderToString(item.display, { displayMode: false, throwOnError: false }); } catch {}
        return { ...item, html };
    });
}

/* ─────────────────────────────────────────────────────────────
   ALL SUBJECT CONFIGS  — snippets, mini, tips, sidebar ref, placeholder
───────────────────────────────────────────────────────────── */
type RefItem = { name: string; input: string; tex: string; note: string };
type TipExample = { title: string; code: string; rendered: string; note: string };
type SubjectConfig = {
    icon: string;
    cats: { name: string; items: { display: string; insert: string; tip: string; html: string }[] }[];
    mini: { display: string; insert: string; tip: string; html: string }[];
    tips: TipExample[];
    ref: RefItem[];
    hintLine: string;
    placeholder: string;
};

function makeConfig(rawCats: { name: string; items: Snippet[] }[], rawMini: Snippet[], tips: TipExample[], ref: RefItem[], hintLine: string, placeholder: string, icon: string): SubjectConfig {
    return {
        icon,
        cats: rawCats.map(cat => ({ name: cat.name, items: preRender(cat.items) })),
        mini: preRender(rawMini),
        tips, ref, hintLine, placeholder,
    };
}

const SUBJECT_CONFIG: Record<string, SubjectConfig> = {

    /* ── MATHEMATICS ── */
    Mathematics: makeConfig(
        [
            { name: "Algebra", items: [
                { display: "\\frac{a}{b}", insert: "\\frac{a}{b}", tip: "Fraction — replace a and b" },
                { display: "\\sqrt{x}", insert: "\\sqrt{x}", tip: "Square root — replace x" },
                { display: "\\sqrt[3]{x}", insert: "\\sqrt[n]{x}", tip: "nth root — replace n and x" },
                { display: "x^{2}", insert: "x^{n}", tip: "Power — replace x and n" },
                { display: "x_{0}", insert: "x_{n}", tip: "Subscript — replace x and n" },
                { display: "\\log_{b}x", insert: "\\log_{b}(x)", tip: "Logarithm base b" },
                { display: "\\ln x", insert: "\\ln(x)", tip: "Natural logarithm" },
                { display: "|x|", insert: "|x|", tip: "Absolute value" },
            ]},
            { name: "Operators", items: [
                { display: "\\pm", insert: "\\pm", tip: "± Plus/Minus" },
                { display: "\\times", insert: "\\times", tip: "× Multiply" },
                { display: "\\div", insert: "\\div", tip: "÷ Divide" },
                { display: "\\neq", insert: "\\neq", tip: "≠ Not equal" },
                { display: "\\leq", insert: "\\leq", tip: "≤ Less or equal" },
                { display: "\\geq", insert: "\\geq", tip: "≥ Greater or equal" },
                { display: "\\approx", insert: "\\approx", tip: "≈ Approximately" },
                { display: "\\infty", insert: "\\infty", tip: "∞ Infinity" },
                { display: "\\therefore", insert: "\\therefore", tip: "∴ Therefore" },
                { display: "\\in", insert: "\\in", tip: "∈ Element of" },
            ]},
            { name: "Greek", items: [
                { display: "\\alpha", insert: "\\alpha", tip: "α Alpha" },
                { display: "\\beta", insert: "\\beta", tip: "β Beta" },
                { display: "\\gamma", insert: "\\gamma", tip: "γ Gamma" },
                { display: "\\delta", insert: "\\delta", tip: "δ Delta" },
                { display: "\\theta", insert: "\\theta", tip: "θ Theta" },
                { display: "\\lambda", insert: "\\lambda", tip: "λ Lambda" },
                { display: "\\mu", insert: "\\mu", tip: "μ Mu" },
                { display: "\\pi", insert: "\\pi", tip: "π Pi" },
                { display: "\\sigma", insert: "\\sigma", tip: "σ Sigma" },
                { display: "\\phi", insert: "\\phi", tip: "φ Phi" },
                { display: "\\omega", insert: "\\omega", tip: "ω Omega" },
                { display: "\\Delta", insert: "\\Delta", tip: "Δ Delta (capital)" },
            ]},
            { name: "Calculus", items: [
                { display: "\\int", insert: "\\int_{a}^{b} f(x)\\,dx", tip: "Definite integral" },
                { display: "\\frac{d}{dx}", insert: "\\frac{d}{dx}()", tip: "Derivative d/dx" },
                { display: "\\frac{dy}{dx}", insert: "\\frac{dy}{dx}", tip: "dy/dx notation" },
                { display: "\\lim_{x\\to0}", insert: "\\lim_{x \\to 0}", tip: "Limit" },
                { display: "\\sum", insert: "\\sum_{i=1}^{n}", tip: "Summation Σ" },
                { display: "\\partial", insert: "\\partial", tip: "∂ Partial derivative" },
            ]},
        ],
        [
            { display: "\\frac{a}{b}", insert: "\\frac{a}{b}", tip: "Fraction" },
            { display: "x^{2}", insert: "x^{n}", tip: "Power" },
            { display: "x_{0}", insert: "x_{n}", tip: "Subscript" },
            { display: "\\sqrt{x}", insert: "\\sqrt{x}", tip: "Square root" },
            { display: "\\pm", insert: "\\pm", tip: "±" },
            { display: "\\times", insert: "\\times", tip: "×" },
            { display: "\\pi", insert: "\\pi", tip: "π" },
            { display: "\\infty", insert: "\\infty", tip: "∞" },
            { display: "\\theta", insert: "\\theta", tip: "θ" },
        ],
        [
            { title: "① Surround math with $ signs", code: "Solve for $x = 5$", rendered: "x = 5", note: "Anything between $ $ becomes a formula" },
            { title: "② Fractions: (a)/(b)", code: "$(x+1)/(x-1)$", rendered: "\\frac{x+1}{x-1}", note: "Parenthesized fraction auto-converts" },
            { title: "③ Roots: sqrt( )", code: "$sqrt(x^2 + 4)$", rendered: "\\sqrt{x^2+4}", note: "Works for any expression" },
            { title: "④ Type greek letters", code: "$theta = pi/4$", rendered: "\\theta = \\frac{\\pi}{4}", note: "alpha, beta, gamma, delta, pi, theta…" },
        ],
        [
            { name: "(a)/(b)", input: "(a)/(b)", tex: "\\frac{a}{b}", note: "fraction" },
            { name: "sqrt(x)", input: "sqrt(x)", tex: "\\sqrt{x}", note: "square root" },
            { name: "x^{n}", input: "x^{n}", tex: "x^{n}", note: "exponent" },
            { name: "x_{n}", input: "x_{n}", tex: "x_{n}", note: "subscript" },
            { name: "pi", input: "pi", tex: "\\pi", note: "" },
            { name: "theta", input: "theta", tex: "\\theta", note: "" },
            { name: ">=  <=  !=", input: ">=", tex: "\\geq", note: "comparisons" },
            { name: "+-", input: "+-", tex: "\\pm", note: "" },
            { name: "infinity / inf", input: "inf", tex: "\\infty", note: "" },
        ],
        "Put math between $ dollar signs $ · Type (a)/(b) for fractions, sqrt(x), pi, theta, >= naturally",
        "Type question here…\n\nExample: Solve for $x$: $(x^2 - 4)/(x + 2) = 3$\n\nTip: write $(top)/(bottom)$ for fractions, sqrt(expr) for roots, and greek letters like theta, pi directly.",
        "∑"
    ),

    /* ── PHYSICS ── */
    Physics: makeConfig(
        [
            { name: "Mechanics", items: [
                { display: "\\vec{F}", insert: "\\vec{F}", tip: "Force vector" },
                { display: "\\vec{v}", insert: "\\vec{v}", tip: "Velocity vector" },
                { display: "\\vec{a}", insert: "\\vec{a}", tip: "Acceleration vector" },
                { display: "\\frac{a}{b}", insert: "\\frac{a}{b}", tip: "Fraction — replace a and b" },
                { display: "x^{2}", insert: "x^{n}", tip: "Power — replace x and n" },
                { display: "\\Delta x", insert: "\\Delta x", tip: "Δx Change in x" },
                { display: "\\mu", insert: "\\mu", tip: "μ Friction coefficient" },
                { display: "\\omega", insert: "\\omega", tip: "ω Angular velocity" },
            ]},
            { name: "Energy", items: [
                { display: "E = mc^2", insert: "E = mc^{2}", tip: "Mass-energy equivalence" },
                { display: "\\frac{1}{2}mv^2", insert: "\\frac{1}{2}mv^{2}", tip: "Kinetic energy" },
                { display: "mgh", insert: "mgh", tip: "Gravitational PE" },
                { display: "P = (W)/(t)", insert: "P = \\frac{W}{t}", tip: "Power = Work/time" },
                { display: "W = Fd\\cos\\theta", insert: "W = Fd\\cos\\theta", tip: "Work formula" },
            ]},
            { name: "Waves & EM", items: [
                { display: "\\lambda", insert: "\\lambda", tip: "λ Wavelength" },
                { display: "\\nu", insert: "\\nu", tip: "ν Frequency" },
                { display: "c = \\lambda\\nu", insert: "c = \\lambda\\nu", tip: "Speed of light" },
                { display: "\\varepsilon_0", insert: "\\varepsilon_0", tip: "ε₀ Permittivity" },
                { display: "\\mu_0", insert: "\\mu_0", tip: "μ₀ Permeability" },
                { display: "\\vec{E}", insert: "\\vec{E}", tip: "Electric field vector" },
                { display: "\\vec{B}", insert: "\\vec{B}", tip: "Magnetic field vector" },
            ]},
            { name: "Units", items: [
                { display: "\\text{m/s}", insert: "\\text{m/s}", tip: "Metres per second" },
                { display: "\\text{m/s}^2", insert: "\\text{m/s}^{2}", tip: "Acceleration unit" },
                { display: "\\text{kg}", insert: "\\text{kg}", tip: "Kilograms" },
                { display: "\\text{N}", insert: "\\text{N}", tip: "Newtons" },
                { display: "\\text{J}", insert: "\\text{J}", tip: "Joules" },
                { display: "\\text{W}", insert: "\\text{W}", tip: "Watts" },
                { display: "\\text{Pa}", insert: "\\text{Pa}", tip: "Pascals" },
            ]},
        ],
        [
            { display: "\\frac{a}{b}", insert: "\\frac{a}{b}", tip: "Fraction" },
            { display: "\\vec{F}", insert: "\\vec{F}", tip: "Vector" },
            { display: "x^{2}", insert: "x^{n}", tip: "Power" },
            { display: "\\Delta x", insert: "\\Delta x", tip: "Change in x" },
            { display: "\\mu", insert: "\\mu", tip: "μ" },
            { display: "\\omega", insert: "\\omega", tip: "ω" },
            { display: "\\lambda", insert: "\\lambda", tip: "λ" },
            { display: "\\text{m/s}", insert: "\\text{m/s}", tip: "m/s" },
            { display: "\\pm", insert: "\\pm", tip: "±" },
        ],
        [
            { title: "① Wrap quantities in $ signs", code: "Mass $m = 2$ kg, force $F = 10$ N", rendered: "F = 10", note: "Isolate the math — leave units outside or use \\text{}" },
            { title: "② Fractions for formulas", code: "$v = (d)/(t)$", rendered: "\\frac{d}{t}", note: "Type (numerator)/(denominator)" },
            { title: "③ Vectors: vec( )", code: "$\\vec{F} = m\\vec{a}$", rendered: "\\vec{F} = m\\vec{a}", note: "Use \\vec{} for vector notation" },
            { title: "④ Units: use \\text{}", code: "$a = 9.8\\,\\text{m/s}^2$", rendered: "9.8\\,\\text{m/s}^{2}", note: "\\text{} keeps units upright" },
        ],
        [
            { name: "(d)/(t)", input: "(d)/(t)", tex: "\\frac{d}{t}", note: "fraction / formula" },
            { name: "\\vec{F}", input: "\\vec{F}", tex: "\\vec{F}", note: "force vector" },
            { name: "\\Delta x", input: "\\Delta x", tex: "\\Delta x", note: "change" },
            { name: "x^{2}", input: "x^{2}", tex: "x^{2}", note: "squared" },
            { name: "\\text{m/s}^2", input: "\\text{m/s}^2", tex: "\\text{m/s}^{2}", note: "unit" },
            { name: "->", input: "->", tex: "\\rightarrow", note: "direction" },
            { name: ">=  <=", input: ">=", tex: "\\geq", note: "inequality" },
            { name: "+-", input: "+-", tex: "\\pm", note: "" },
        ],
        "Wrap quantities in $ signs $ · Type (a)/(b) for fractions, \\vec{F} for vectors, \\text{m/s} for units",
        "Type question here…\n\nExample: An object of mass $m = 2\\,\\text{kg}$ accelerates at $a = 5\\,\\text{m/s}^2$.\nFind the net force $F$.\n\nTip: use $F = ma$, type -> for arrows, >= for ≥",
        "⚡"
    ),

    /* ── CHEMISTRY ── */
    Chemistry: makeConfig(
        [
            { name: "Reactions", items: [
                { display: "\\rightarrow", insert: "\\rightarrow", tip: "→ Reaction arrow" },
                { display: "\\rightleftharpoons", insert: "\\rightleftharpoons", tip: "⇌ Equilibrium" },
                { display: "\\overset{\\Delta}{\\rightarrow}", insert: "\\overset{\\Delta}{\\rightarrow}", tip: "→ Heat above arrow" },
                { display: "\\uparrow", insert: "\\uparrow", tip: "↑ Gas produced" },
                { display: "\\downarrow", insert: "\\downarrow", tip: "↓ Precipitate" },
            ]},
            { name: "Compounds", items: [
                { display: "\\text{H}_2\\text{O}", insert: "\\text{H}_2\\text{O}", tip: "H₂O Water" },
                { display: "\\text{CO}_2", insert: "\\text{CO}_2", tip: "CO₂" },
                { display: "\\text{O}_2", insert: "\\text{O}_2", tip: "O₂ Oxygen" },
                { display: "\\text{H}_2", insert: "\\text{H}_2", tip: "H₂ Hydrogen" },
                { display: "\\text{NaCl}", insert: "\\text{NaCl}", tip: "NaCl Salt" },
                { display: "\\text{H}_2\\text{SO}_4", insert: "\\text{H}_2\\text{SO}_4", tip: "H₂SO₄ Sulfuric acid" },
                { display: "\\text{HCl}", insert: "\\text{HCl}", tip: "HCl Hydrochloric acid" },
                { display: "\\text{NH}_3", insert: "\\text{NH}_3", tip: "NH₃ Ammonia" },
            ]},
            { name: "Charges", items: [
                { display: "^{+}", insert: "^{+}", tip: "⁺ Positive charge" },
                { display: "^{-}", insert: "^{-}", tip: "⁻ Negative charge" },
                { display: "^{2+}", insert: "^{2+}", tip: "²⁺ 2+ charge" },
                { display: "^{2-}", insert: "^{2-}", tip: "²⁻ 2− charge" },
                { display: "\\text{Ca}^{2+}", insert: "\\text{Ca}^{2+}", tip: "Ca²⁺ Calcium ion" },
                { display: "\\text{Cl}^{-}", insert: "\\text{Cl}^{-}", tip: "Cl⁻ Chloride ion" },
            ]},
            { name: "Quantities", items: [
                { display: "\\text{mol}", insert: "\\text{mol}", tip: "mol — amount" },
                { display: "\\text{g/mol}", insert: "\\text{g/mol}", tip: "Molar mass unit" },
                { display: "\\text{mol/L}", insert: "\\text{mol/L}", tip: "Concentration" },
                { display: "K_{eq}", insert: "K_{eq}", tip: "Equilibrium constant" },
                { display: "\\Delta H", insert: "\\Delta H", tip: "ΔH Enthalpy" },
                { display: "\\Delta G", insert: "\\Delta G", tip: "ΔG Gibbs energy" },
                { display: "\\Delta S", insert: "\\Delta S", tip: "ΔS Entropy" },
            ]},
        ],
        [
            { display: "\\rightarrow", insert: "\\rightarrow", tip: "→ reaction" },
            { display: "\\rightleftharpoons", insert: "\\rightleftharpoons", tip: "⇌ equilibrium" },
            { display: "^{+}", insert: "^{+}", tip: "⁺ charge" },
            { display: "^{-}", insert: "^{-}", tip: "⁻ charge" },
            { display: "\\text{H}_2\\text{O}", insert: "\\text{H}_2\\text{O}", tip: "H₂O" },
            { display: "\\Delta H", insert: "\\Delta H", tip: "ΔH" },
            { display: "\\uparrow", insert: "\\uparrow", tip: "↑ gas" },
            { display: "\\downarrow", insert: "\\downarrow", tip: "↓ precipitate" },
            { display: "\\text{mol}", insert: "\\text{mol}", tip: "mol" },
        ],
        [
            { title: "① Write compounds in $ signs", code: "$\\text{H}_2\\text{O}$", rendered: "\\text{H}_2\\text{O}", note: "Use \\text{} for element symbols, _ for subscripts" },
            { title: "② Reaction arrow: ->", code: "$\\text{H}_2 + \\text{O}_2 -> \\text{H}_2\\text{O}$", rendered: "\\text{H}_2 + \\text{O}_2 \\rightarrow \\text{H}_2\\text{O}", note: "Type -> for →, use equilibrium button for ⇌" },
            { title: "③ Ions and charges: ^{+}", code: "$\\text{Ca}^{2+}$, $\\text{Cl}^{-}$", rendered: "\\text{Ca}^{2+}", note: "Use ^{2+} or ^{-} after the element symbol" },
            { title: "④ Thermodynamic symbols", code: "$\\Delta H = -286\\,\\text{kJ/mol}$", rendered: "\\Delta H = -286\\,\\text{kJ/mol}", note: "Delta H, Delta G, Delta S from the Quantities tab" },
        ],
        [
            { name: "->", input: "->", tex: "\\rightarrow", note: "reaction arrow" },
            { name: "subscript: _{2}", input: "\\text{H}_{2}", tex: "\\text{H}_{2}", note: "atoms" },
            { name: "charge: ^{+}", input: "^{+}", tex: "^{+}", note: "ion charge" },
            { name: "\\Delta H", input: "\\Delta H", tex: "\\Delta H", note: "enthalpy" },
            { name: "\\Delta G", input: "\\Delta G", tex: "\\Delta G", note: "Gibbs" },
            { name: "K_{eq}", input: "K_{eq}", tex: "K_{eq}", note: "equilibrium constant" },
            { name: "\\uparrow  \\downarrow", input: "\\uparrow", tex: "\\uparrow", note: "gas / precipitate" },
        ],
        "Write compounds in $ signs $ · Type -> for →, use element buttons in Compounds tab · ^{+} for charges",
        "Type question here…\n\nExample: Balance the equation:\n$\\text{C}_3\\text{H}_8 + \\text{O}_2 -> \\text{CO}_2 + \\text{H}_2\\text{O}$\n\nTip: type -> for reaction arrow, use _ for subscripts: $\\text{H}_2\\text{O}$",
        "⚗"
    ),

    /* ── BIOLOGY ── */
    Biology: makeConfig(
        [
            { name: "Notation", items: [
                { display: "\\text{ATP}", insert: "\\text{ATP}", tip: "ATP" },
                { display: "\\text{DNA}", insert: "\\text{DNA}", tip: "DNA" },
                { display: "\\text{RNA}", insert: "\\text{RNA}", tip: "RNA" },
                { display: "\\text{CO}_2", insert: "\\text{CO}_2", tip: "CO₂" },
                { display: "\\text{O}_2", insert: "\\text{O}_2", tip: "O₂" },
                { display: "\\text{H}_2\\text{O}", insert: "\\text{H}_2\\text{O}", tip: "H₂O" },
                { display: "\\text{C}_6\\text{H}_{12}\\text{O}_6", insert: "\\text{C}_6\\text{H}_{12}\\text{O}_6", tip: "Glucose" },
            ]},
            { name: "Genetics", items: [
                { display: "\\text{AA}", insert: "\\text{AA}", tip: "Homozygous dominant" },
                { display: "\\text{Aa}", insert: "\\text{Aa}", tip: "Heterozygous" },
                { display: "\\text{aa}", insert: "\\text{aa}", tip: "Homozygous recessive" },
                { display: "\\text{P}_1", insert: "\\text{P}_1", tip: "Parental generation" },
                { display: "\\text{F}_1", insert: "\\text{F}_1", tip: "First filial generation" },
                { display: "\\text{F}_2", insert: "\\text{F}_2", tip: "Second filial generation" },
                { display: "3:1", insert: "3:1", tip: "3:1 ratio" },
            ]},
            { name: "Process", items: [
                { display: "\\rightarrow", insert: "\\rightarrow", tip: "→ leads to" },
                { display: "\\uparrow", insert: "\\uparrow", tip: "↑ increases" },
                { display: "\\downarrow", insert: "\\downarrow", tip: "↓ decreases" },
                { display: "\\approx", insert: "\\approx", tip: "≈ approximately" },
                { display: "\\Delta", insert: "\\Delta", tip: "Δ change in" },
                { display: "\\%", insert: "\\%", tip: "% percent" },
            ]},
        ],
        [
            { display: "\\text{ATP}", insert: "\\text{ATP}", tip: "ATP" },
            { display: "\\text{DNA}", insert: "\\text{DNA}", tip: "DNA" },
            { display: "\\text{RNA}", insert: "\\text{RNA}", tip: "RNA" },
            { display: "\\text{CO}_2", insert: "\\text{CO}_2", tip: "CO₂" },
            { display: "\\text{O}_2", insert: "\\text{O}_2", tip: "O₂" },
            { display: "\\rightarrow", insert: "\\rightarrow", tip: "→" },
            { display: "\\uparrow", insert: "\\uparrow", tip: "↑" },
            { display: "\\downarrow", insert: "\\downarrow", tip: "↓" },
        ],
        [
            { title: "① Molecules in $ signs", code: "$\\text{ATP}$ is produced in mitochondria", rendered: "\\text{ATP}", note: "Use \\text{} for abbreviations like ATP, DNA, RNA" },
            { title: "② Chemical formulas", code: "$\\text{C}_6\\text{H}_{12}\\text{O}_6$", rendered: "\\text{C}_6\\text{H}_{12}\\text{O}_6", note: "Click the button in Notation tab" },
            { title: "③ Genetics notation", code: "$\\text{Aa} \\times \\text{Aa}$", rendered: "\\text{Aa} \\times \\text{Aa}", note: "Use the Genetics tab for genotype buttons" },
            { title: "④ Process arrows", code: "Light energy $\\rightarrow$ Glucose", rendered: "\\rightarrow", note: "Type -> for arrows, ↑ for increases, ↓ for decreases" },
        ],
        [
            { name: "->  sequence", input: "->", tex: "\\rightarrow", note: "process/leads to" },
            { name: "\\text{ATP}", input: "\\text{ATP}", tex: "\\text{ATP}", note: "molecule name" },
            { name: "\\text{DNA}", input: "\\text{DNA}", tex: "\\text{DNA}", note: "" },
            { name: "Aa genotype", input: "\\text{Aa}", tex: "\\text{Aa}", note: "genetics" },
            { name: "F_1 generation", input: "\\text{F}_1", tex: "\\text{F}_1", note: "" },
            { name: "↑ increases", input: "\\uparrow", tex: "\\uparrow", note: "" },
            { name: "↓ decreases", input: "\\downarrow", tex: "\\downarrow", note: "" },
        ],
        "Biology: use $ signs $ for molecules, genotypes, ratios · Type -> for arrows",
        "Type question here…\n\nExample: Describe the role of $\\text{ATP}$ in cellular respiration.\nWrite the overall equation:\n$\\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{O}_2 -> \\text{CO}_2 + \\text{H}_2\\text{O} + \\text{ATP}$\n\nTip: no special formatting needed for text-only answers.",
        "🧬"
    ),

    /* ── ENGLISH ── */
    English: makeConfig(
        [
            { name: "Quotes", items: [
                { display: "\\text{\"...\"}", insert: "\\text{\"\"}", tip: "Double quotation marks" },
                { display: "\\text{'...'}", insert: "\\text{''}", tip: "Single quotation / apostrophe" },
                { display: "\\ldots", insert: "\\ldots", tip: "… Ellipsis" },
                { display: "\\text{---}", insert: "\\text{---}", tip: "Em dash" },
                { display: "\\text{--}", insert: "\\text{--}", tip: "En dash" },
            ]},
            { name: "Phonetics", items: [
                { display: "\\text{/θ/}", insert: "\\text{/θ/}", tip: "/θ/ voiceless dental fricative (thin)" },
                { display: "\\text{/ð/}", insert: "\\text{/ð/}", tip: "/ð/ voiced dental fricative (this)" },
                { display: "\\text{/ʃ/}", insert: "\\text{/ʃ/}", tip: "/ʃ/ sh sound" },
                { display: "\\text{/ŋ/}", insert: "\\text{/ŋ/}", tip: "/ŋ/ ng sound (sing)" },
                { display: "\\text{/æ/}", insert: "\\text{/æ/}", tip: "/æ/ short a (cat)" },
                { display: "\\text{/ɪ/}", insert: "\\text{/ɪ/}", tip: "/ɪ/ short i (bit)" },
            ]},
            { name: "Misc", items: [
                { display: "\\underline{x}", insert: "\\underline{word}", tip: "Underline text" },
                { display: "\\textit{x}", insert: "\\textit{word}", tip: "Italic" },
                { display: "\\textbf{x}", insert: "\\textbf{word}", tip: "Bold" },
                { display: "\\neq", insert: "\\neq", tip: "≠ not equal / contrasting" },
                { display: "\\rightarrow", insert: "\\rightarrow", tip: "→ leads to / results in" },
            ]},
        ],
        [
            { display: "\\ldots", insert: "\\ldots", tip: "…" },
            { display: "\\underline{x}", insert: "\\underline{word}", tip: "Underline" },
            { display: "\\textit{x}", insert: "\\textit{word}", tip: "Italic" },
            { display: "\\textbf{x}", insert: "\\textbf{word}", tip: "Bold" },
            { display: "\\rightarrow", insert: "\\rightarrow", tip: "→" },
            { display: "\\text{/θ/}", insert: "\\text{/θ/}", tip: "/θ/" },
        ],
        [
            { title: "① Quoting text in $ signs", code: "\"$\\text{To be or not to be}$\"", rendered: "\\text{To be or not to be}", note: "Use \\text{} to keep words formatted correctly" },
            { title: "② Phonetic symbols", code: "The word \"thin\" uses $\\text{/θ/}$", rendered: "\\text{/θ/}", note: "Find phonetic buttons in the Phonetics tab" },
            { title: "③ Most of an English question needs no $", code: "Identify the literary device in the passage.", rendered: "", note: "Only use $ when you need special symbols" },
            { title: "④ Emphasis or structure", code: "$\\underline{\\text{Underline}}$ the correct word.", rendered: "\\underline{\\text{word}}", note: "Use underline, italic, or bold from the Misc tab" },
        ],
        [
            { name: "\\ldots", input: "\\ldots", tex: "\\ldots", note: "ellipsis" },
            { name: "\\underline{word}", input: "\\underline{word}", tex: "\\underline{\\text{word}}", note: "underline" },
            { name: "\\textit{word}", input: "\\textit{word}", tex: "\\textit{word}", note: "italic" },
            { name: "\\textbf{word}", input: "\\textbf{word}", tex: "\\textbf{word}", note: "bold" },
            { name: "->", input: "->", tex: "\\rightarrow", note: "leads to" },
            { name: "phonetic /θ/", input: "\\text{/θ/}", tex: "\\text{/θ/}", note: "IPA symbol" },
        ],
        "English: wrap special symbols in $ signs $ · Use \\text{} for words, \\underline{} to underline",
        "Type question here…\n\nExample: Identify the literary device used in the following passage, then explain its effect on the reader.\n\nTip: most English questions need no special formatting — just type normally.",
        "📝"
    ),
};

/* ─── Interfaces ─── */
interface Question {
    id: number;
    text: string;
    options: Record<"A" | "B" | "C" | "D", string>;
    correct: "A" | "B" | "C" | "D" | "";
    points: number;
}
const blankQ = (): Question => ({ id: Date.now() + Math.random(), text: "", options: { A: "", B: "", C: "", D: "" }, correct: "", points: 1 });

interface BankQ { id: number; q: string; subj: string; type: string; used: number; }
const INITIAL_BANK: BankQ[] = [
    { id: 1, q: "Find the derivative of $f(x) = x^3 + 2x^2 - 5x$", subj: "Mathematics", type: "Multiple Choice", used: 3 },
    { id: 2, q: "Explain Newton's Second Law of Motion in your own words.", subj: "Physics", type: "Short Answer", used: 5 },
    { id: 3, q: "Balance: $\\text{H}_2 + \\text{O}_2 \\rightarrow \\text{H}_2\\text{O}$", subj: "Chemistry", type: "Multiple Choice", used: 2 },
    { id: 4, q: "Calculate the area under $y = x^2$ from $x = 0$ to $x = 3$", subj: "Mathematics", type: "Problem Solving", used: 1 },
    { id: 5, q: "What is the electric field at distance $r$ from a point charge $q$?", subj: "Physics", type: "Multiple Choice", used: 4 },
    { id: 6, q: "What is the molecular formula of glucose?", subj: "Chemistry", type: "Multiple Choice", used: 6 },
];

type Assessment = { id: number; name: string; type: string; maxMark: number; result: number };
type ResultRow = { name: string; quiz: string; subject: string; score: number; grade: string; sent: boolean; comment: string; sentAt: string; assessments: Assessment[] };

const DEFAULT_ASSESSMENTS = (): Assessment[] => [
    { id: 1, name: "Quiz-1",               type: "continuous", maxMark: 5,  result: 0 },
    { id: 2, name: "Quiz-2",               type: "continuous", maxMark: 5,  result: 0 },
    { id: 3, name: "Mid-term Examination", type: "midterm",    maxMark: 20, result: 0 },
    { id: 4, name: "Assignment-1",         type: "continuous", maxMark: 10, result: 0 },
    { id: 5, name: "Assignment-2",         type: "continuous", maxMark: 10, result: 0 },
    { id: 6, name: "Final Exam",           type: "final",      maxMark: 50, result: 0 },
];

function calcScore(list: Assessment[]): number {
    const totalMax = list.reduce((s, a) => s + a.maxMark, 0);
    const totalResult = list.reduce((s, a) => s + a.result, 0);
    if (totalMax === 0) return 0;
    return Math.round((totalResult / totalMax) * 1000) / 10;
}

function autoGrade(score: number): string {
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 67) return "D+";
    if (score >= 63) return "D";
    if (score >= 60) return "D-";
    return "F";
}

/* ─── LatexField component ─── */
interface LatexFieldProps {
    label: string; value: string; onChange: (v: string) => void;
    rows?: number; placeholder?: string; mini?: boolean; subject?: string;
}

function LatexField({ label, value, onChange, rows = 3, placeholder, mini = false, subject = "Mathematics" }: LatexFieldProps) {
    const cfg = SUBJECT_CONFIG[subject] ?? SUBJECT_CONFIG["Mathematics"];
    const [activeCat, setActiveCat] = useState(0);
    const [showTips, setShowTips] = useState(false);
    const taRef = useCallback((node: HTMLTextAreaElement | null) => {
        if (node) (window as unknown as Record<string, HTMLTextAreaElement>)[`_lf_${label}`] = node;
    }, [label]);

    const insertSnippet = (item: Snippet) => {
        const ta = (window as unknown as Record<string, HTMLTextAreaElement>)[`_lf_${label}`];
        const ins = ` $${item.insert}$ `;
        if (ta) {
            const s = ta.selectionStart ?? value.length;
            const e = ta.selectionEnd ?? value.length;
            onChange(value.slice(0, s) + ins + value.slice(e));
            setTimeout(() => { ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length); }, 0);
        } else { onChange(value + ins); }
    };

    const snippetBtn = (item: Snippet & { html: string }, key: string) => (
        <button key={key} title={item.tip} onClick={() => insertSnippet(item)}
            dangerouslySetInnerHTML={{ __html: item.html }}
            style={{ padding: "0.1rem 0.4rem", minWidth: 30, height: 26, borderRadius: 5, border: "1.5px solid var(--gray-200)", background: "#fff", cursor: "pointer" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-50)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary-300)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gray-200)"; }}
        />
    );

    return (
        <div style={{ marginBottom: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</label>
                {!mini && (
                    <button onClick={() => setShowTips(t => !t)} style={{ fontSize: "0.68rem", fontWeight: 600, color: showTips ? "#b45309" : "var(--primary-600)", background: showTips ? "#fef3c7" : "var(--primary-50)", border: `1px solid ${showTips ? "#fde68a" : "var(--primary-200)"}`, borderRadius: 5, padding: "0.1rem 0.45rem", cursor: "pointer" }}>
                        {showTips ? "✕ Hide tips" : `? How to write ${subject ?? "math"}`}
                    </button>
                )}
            </div>

            {/* Teacher-friendly tips panel — subject-specific */}
            {!mini && showTips && (
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "0.75rem 0.875rem", marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.82rem", marginBottom: "0.6rem" }}>{cfg.icon} Writing {subject} — quick guide</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                        {cfg.tips.map(tip => {
                            let rendered = "";
                            if (tip.rendered) { try { rendered = katex.renderToString(tip.rendered, { throwOnError: false }); } catch {} }
                            return (
                                <div key={tip.title} style={{ background: "#fff", borderRadius: 8, padding: "0.5rem 0.65rem" }}>
                                    <div style={{ fontWeight: 700, color: "#78350f", fontSize: "0.75rem", marginBottom: "0.25rem" }}>{tip.title}</div>
                                    <code style={{ fontSize: "0.72rem", color: "#b45309", display: "block", marginBottom: "0.15rem" }}>{tip.code}</code>
                                    {rendered && <div style={{ fontSize: "0.7rem", color: "#78350f" }}>→&nbsp;<span dangerouslySetInnerHTML={{ __html: rendered }} /></div>}
                                    <div style={{ fontSize: "0.67rem", color: "#a16207", marginTop: "0.15rem" }}>{tip.note}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {mini ? (
                /* Compact subject-specific single-row toolbar for option fields */
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.2rem", marginBottom: "0.35rem" }}>
                    {cfg.mini.map(item => snippetBtn(item, item.insert))}
                </div>
            ) : (
                /* Full subject-specific categorized toolbar for question text */
                <div style={{ background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: 10, padding: "0.4rem 0.5rem", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.4rem", flexWrap: "wrap" as const }}>
                        {cfg.cats.map((cat, i) => (
                            <button key={cat.name} onClick={() => setActiveCat(i)}
                                style={{ padding: "0.1rem 0.5rem", borderRadius: 5, fontSize: "0.68rem", fontWeight: 600, border: "1.5px solid", cursor: "pointer",
                                    borderColor: activeCat === i ? "var(--primary-500)" : "transparent",
                                    background: activeCat === i ? "var(--primary-50)" : "transparent",
                                    color: activeCat === i ? "var(--primary-600)" : "var(--gray-500)" }}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.2rem" }}>
                        {cfg.cats[Math.min(activeCat, cfg.cats.length - 1)].items.map(item => snippetBtn(item, item.insert))}
                    </div>
                </div>
            )}

            <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
                style={{ width: "100%", padding: "0.65rem 0.9rem", background: "#fff", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontFamily: "monospace", resize: "vertical" as const, lineHeight: 1.6, boxSizing: "border-box" as const }}
                onFocus={e => { e.target.style.borderColor = "var(--primary-400)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-50)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--gray-200)"; e.target.style.boxShadow = "none"; }} />

            {/* Always-visible live preview when there is content */}
            {!mini && value.trim() && (
                <div style={{ marginTop: "0.3rem", padding: "0.5rem 0.75rem", background: "var(--primary-50)", border: "1px solid var(--primary-100)", borderRadius: 8, fontSize: "0.9rem", lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: renderLatex(value) }} />
            )}
            {!mini && <p style={{ fontSize: "0.63rem", color: "var(--gray-400)", marginTop: "0.2rem" }}>{cfg.hintLine}</p>}
        </div>
    );
}

export default function TeacherExams() {
    const [isClient, setIsClient] = useState(false);
    const [activeTab, setActiveTab] = useState<"create" | "bank" | "results">("create");

    // Quiz meta
    const [quizTitle, setQuizTitle] = useState("");
    const [subject, setSubject] = useState("Mathematics");
    const [classGroup, setClassGroup] = useState("Grade 11-A");
    const [duration, setDuration] = useState("30");

    // Questions
    const [questions, setQuestions] = useState<Question[]>([blankQ()]);
    const [activeQ, setActiveQ] = useState(0);
    const q = questions[activeQ];
    const updateQ = (patch: Partial<Question>) =>
        setQuestions(prev => prev.map((qq, i) => i === activeQ ? { ...qq, ...patch } : qq));

    // Bank state (mutable so Edit/Use work)
    const [bank, setBank] = useState<BankQ[]>(INITIAL_BANK);
    const [bankSearch, setBankSearch] = useState("");
    const [editingBank, setEditingBank] = useState<BankQ | null>(null);

    // Results
    const [results, setResults] = useState<ResultRow[]>([
        { name: "Abebe Kebede",    quiz: "Ch.7 Calculus Quiz", subject: "Mathematics", score: 92, grade: "A",  sent: false, comment: "",             sentAt: "",           assessments: [{ id:1, name:"Quiz-1",               type:"continuous", maxMark:5,  result:5   }, { id:2, name:"Quiz-2",               type:"continuous", maxMark:5,  result:4   }, { id:3, name:"Mid-term Examination", type:"midterm",    maxMark:20, result:18  }, { id:4, name:"Assignment-1",         type:"continuous", maxMark:10, result:9   }, { id:5, name:"Assignment-2",         type:"continuous", maxMark:10, result:9   }, { id:6, name:"Final Exam",           type:"final",      maxMark:50, result:47  }] },
        { name: "Kalkidan Assefa", quiz: "Ch.7 Calculus Quiz", subject: "Mathematics", score: 88, grade: "A-", sent: false, comment: "",             sentAt: "",           assessments: [{ id:1, name:"Quiz-1",               type:"continuous", maxMark:5,  result:4   }, { id:2, name:"Quiz-2",               type:"continuous", maxMark:5,  result:4   }, { id:3, name:"Mid-term Examination", type:"midterm",    maxMark:20, result:17  }, { id:4, name:"Assignment-1",         type:"continuous", maxMark:10, result:9   }, { id:5, name:"Assignment-2",         type:"continuous", maxMark:10, result:9   }, { id:6, name:"Final Exam",           type:"final",      maxMark:50, result:45  }] },
        { name: "Meron Girma",     quiz: "Ch.7 Calculus Quiz", subject: "Mathematics", score: 75, grade: "B",  sent: true,  comment: "Good effort!", sentAt: "2026-03-08", assessments: [{ id:1, name:"Quiz-1",               type:"continuous", maxMark:5,  result:3   }, { id:2, name:"Quiz-2",               type:"continuous", maxMark:5,  result:4   }, { id:3, name:"Mid-term Examination", type:"midterm",    maxMark:20, result:15  }, { id:4, name:"Assignment-1",         type:"continuous", maxMark:10, result:7.5 }, { id:5, name:"Assignment-2",         type:"continuous", maxMark:10, result:7.5 }, { id:6, name:"Final Exam",           type:"final",      maxMark:50, result:38  }] },
        { name: "Samuel Dereje",   quiz: "Ch.7 Calculus Quiz", subject: "Mathematics", score: 95, grade: "A+", sent: true,  comment: "",             sentAt: "2026-03-08", assessments: [{ id:1, name:"Quiz-1",               type:"continuous", maxMark:5,  result:5   }, { id:2, name:"Quiz-2",               type:"continuous", maxMark:5,  result:5   }, { id:3, name:"Mid-term Examination", type:"midterm",    maxMark:20, result:19  }, { id:4, name:"Assignment-1",         type:"continuous", maxMark:10, result:9.5 }, { id:5, name:"Assignment-2",         type:"continuous", maxMark:10, result:9.5 }, { id:6, name:"Final Exam",           type:"final",      maxMark:50, result:47  }] },
    ]);

    // Toast
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

    const addQuestion = () => { setQuestions(p => [...p, blankQ()]); setActiveQ(questions.length); };
    const removeQuestion = (idx: number) => { if (questions.length === 1) return; setQuestions(p => p.filter((_, i) => i !== idx)); setActiveQ(Math.min(idx, questions.length - 2)); };

    const handlePublish = () => {
        if (!quizTitle.trim()) { showToast("Enter a quiz title", false); return; }
        const bad = questions.filter(qq => !qq.correct || !qq.text.trim());
        if (bad.length) { showToast(`${bad.length} question(s) incomplete`, false); return; }
        showToast(`"${quizTitle}" published to ${classGroup} ✓`);
        setQuizTitle(""); setQuestions([blankQ()]); setActiveQ(0);
    };

    // Add a bank question into the current quiz
    const useFromBank = (item: BankQ) => {
        const newQ: Question = { ...blankQ(), text: item.q };
        setQuestions(p => { const next = [...p, newQ]; setActiveQ(next.length - 1); return next; });
        setBank(p => p.map(b => b.id === item.id ? { ...b, used: b.used + 1 } : b));
        setActiveTab("create");
        showToast("Question added — fill in the answer options ✓");
    };

    // Save edits to a bank question
    const saveBankEdit = () => {
        if (!editingBank) return;
        setBank(p => p.map(b => b.id === editingBank.id ? editingBank : b));
        setEditingBank(null);
        showToast("Bank question updated ✓");
    };

    const filteredBank = bankSearch.trim()
        ? bank.filter(b => b.q.toLowerCase().includes(bankSearch.toLowerCase()) || b.subj.toLowerCase().includes(bankSearch.toLowerCase()))
        : bank;

    // ── Evaluate modal state ─────────────────────────────────────────────────
    const [evaluating, setEvaluating] = useState<ResultRow | null>(null);
    const [evalAssessments, setEvalAssessments] = useState<Assessment[]>([]);
    const [evalComment, setEvalComment] = useState("");
    const evalTotalMax    = evalAssessments.reduce((s, a) => s + a.maxMark, 0);
    const evalTotalResult = evalAssessments.reduce((s, a) => s + a.result, 0);
    const evalScore       = calcScore(evalAssessments);
    const evalGrade       = autoGrade(evalScore);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // ── Store grade sender ──────────────────────────────────────────────────
    const storeSendGrade = useExamStore(s => s.sendGrade);

    const openEvaluate = (row: ResultRow) => {
        setEvaluating(row);
        setEvalAssessments(row.assessments.length > 0 ? row.assessments.map(a => ({ ...a })) : DEFAULT_ASSESSMENTS());
        setEvalComment(row.comment);
    };

    const saveEval = (sendNow: boolean) => {
        if (!evaluating) return;
        const score = calcScore(evalAssessments);
        const grade = autoGrade(score);
        const now = new Date().toISOString().slice(0, 10);
        const updated: ResultRow = {
            ...evaluating,
            score,
            grade,
            comment: evalComment,
            assessments: evalAssessments,
            sent: sendNow ? true : evaluating.sent,
            sentAt: sendNow && !evaluating.sentAt ? now : evaluating.sentAt,
        };
        setResults(p => p.map(r => r.name === evaluating.name && r.quiz === evaluating.quiz ? updated : r));
        if (sendNow) {
            storeSendGrade({ studentName: updated.name, quizTitle: updated.quiz, subject: updated.subject, score: updated.score, grade: updated.grade, comment: updated.comment, sentAt: updated.sentAt, assessments: updated.assessments });
            showToast(`Grade sent to ${updated.name} ✓`);
        } else {
            showToast("Evaluation saved ✓");
        }
        setEvaluating(null);
    };

    const downloadPDF = () => {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();
        const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        const BLUE   = [30,  58, 138] as [number,number,number];
        const DKGRAY = [30,  30,  30] as [number,number,number];
        const MDGRAY = [100,100,100] as [number,number,number];

        // ─── Institution header band ──────────────────────────────────
        doc.setFillColor(...BLUE);
        doc.rect(0, 0, pageW, 28, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("TRILINK SCHOOL", pageW / 2, 11, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Academic Assessment Transcript  \u2014  Teacher Copy", pageW / 2, 18, { align: "center" });
        doc.text(`Generated: ${now}`, pageW / 2, 24, { align: "center" });

        // ─── Meta info block ──────────────────────────────────────────
        doc.setTextColor(...DKGRAY);
        let yy = 35;
        const metaRows: [string, string][] = [
            ["Class Group", classGroup],
            ["Course / Quiz", results[0]?.quiz ?? ""],
            ["Subject",      results[0]?.subject ?? ""],
            ["Total Students", String(results.length)],
        ];
        const colW = (pageW - 28) / 2;
        metaRows.forEach(([k, v], idx) => {
            const x = idx % 2 === 0 ? 14 : 14 + colW + 4;
            if (idx % 2 === 0 && idx > 0) yy += 7;
            doc.setFont("helvetica", "bold");   doc.setFontSize(8);  doc.setTextColor(...MDGRAY);  doc.text(k.toUpperCase(), x, yy);
            doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...DKGRAY);  doc.text(v, x, yy + 4.5);
        });
        yy += 12;

        // ─── Divider ──────────────────────────────────────────────────
        doc.setDrawColor(...BLUE);
        doc.setLineWidth(0.5);
        doc.line(14, yy, pageW - 14, yy);
        yy += 5;

        // ─── Per-student assessment breakdown ─────────────────────────
        results.forEach((r, si) => {
            // Student name header row
            if (yy > 250) { doc.addPage(); yy = 15; }
            doc.setFillColor(239, 246, 255);
            doc.roundedRect(14, yy, pageW - 28, 8, 2, 2, "F");
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...BLUE);
            doc.text(`${si + 1}.  ${r.name}`, 18, yy + 5.5);
            doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MDGRAY);
            doc.text(`Status: ${r.sent ? "Sent" : "Pending"}`, pageW - 14, yy + 5.5, { align: "right" });
            yy += 10;

            // Assessment breakdown table
            const assessRows = r.assessments.length > 0
                ? r.assessments.map((a, i) => [(i + 1).toString(), a.name, a.type, String(a.maxMark), String(a.result), ""])
                : [["--", "No breakdown available", "", "", "", ""]];

            const totalMax    = r.assessments.reduce((s, a) => s + a.maxMark, 0);
            const totalResult = r.assessments.reduce((s, a) => s + a.result, 0);

            autoTable(doc, {
                startY: yy,
                margin: { left: 14, right: 14 },
                head: [["SN", "Assessment Name", "Type", "Max Mark", "Result", "Grade"]],
                body: assessRows,
                foot: [[{ content: "Totals", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } }, String(totalMax), `${totalResult}/${totalMax}`, r.grade]],
                theme: "grid",
                styles: { fontSize: 8.5, cellPadding: 2.5, textColor: DKGRAY },
                headStyles: { fillColor: BLUE, textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
                footStyles: { fillColor: [240,253,244], textColor: [6,95,70], fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248,250,252] },
                columnStyles: {
                    0: { cellWidth: 9 },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 22, halign: "center" },
                    4: { cellWidth: 25, halign: "center" },
                    5: { cellWidth: 18, halign: "center" },
                },
                didParseCell: (data) => {
                    if (data.section === "foot" && data.column.index === 5) {
                        const g = data.cell.raw as string;
                        data.cell.styles.textColor = g.startsWith("A") ? [6,95,70] : g.startsWith("B") ? [30,58,138] : g.startsWith("F") ? [153,27,27] : [146,64,14];
                    }
                },
            });
            yy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

            // Score summary line
            doc.setFont("helvetica", "bold"); doc.setFontSize(9);
            doc.setTextColor(...BLUE);
            doc.text(`Final Score: ${r.score}%   ·   Grade: ${r.grade}`, 18, yy + 4);
            if (r.comment) {
                doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(...MDGRAY);
                doc.text(`Feedback: ${r.comment}`, 18, yy + 9, { maxWidth: pageW - 36 });
                yy += 6;
            }
            yy += 10;
        });

        // ─── Summary roster table ──────────────────────────────────────
        if (yy > 220) { doc.addPage(); yy = 15; }
        doc.setDrawColor(...BLUE); doc.setLineWidth(0.5);
        doc.line(14, yy, pageW - 14, yy); yy += 5;
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...BLUE);
        doc.text("Class Summary Roster", 14, yy); yy += 6;

        autoTable(doc, {
            startY: yy,
            margin: { left: 14, right: 14 },
            head: [["#", "Student Name", "Quiz / Course", "Total Score", "Grade", "Status", "Date Sent"]],
            body: results.map((r, i) => [
                String(i + 1),
                r.name,
                r.quiz,
                `${r.score}%`,
                r.grade,
                r.sent ? "Sent" : "Pending",
                r.sentAt || "—",
            ]),
            theme: "striped",
            styles: { fontSize: 9, cellPadding: 3, textColor: DKGRAY },
            headStyles: { fillColor: BLUE, textColor: [255,255,255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248,250,252] },
            columnStyles: {
                0: { cellWidth: 9 },
                3: { halign: "center" },
                4: { halign: "center", fontStyle: "bold" },
                5: { halign: "center" },
                6: { halign: "center" },
            },
            didParseCell: (data) => {
                if (data.section === "body" && data.column.index === 4) {
                    const g = String(data.cell.raw);
                    data.cell.styles.textColor = g.startsWith("A") ? [6,95,70] : g.startsWith("B") ? [30,58,138] : g.startsWith("F") ? [153,27,27] : [146,64,14];
                }
                if (data.section === "body" && data.column.index === 5) {
                    data.cell.styles.textColor = data.cell.raw === "Sent" ? [6,95,70] : [146,64,14];
                }
            },
        });

        // ─── Footer on every page ─────────────────────────────────────
        const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            const pageH = doc.internal.pageSize.getHeight();
            doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
            doc.line(14, pageH - 12, pageW - 14, pageH - 12);
            doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(160,160,160);
            doc.text("Trilink School — Confidential Teacher Transcript", 14, pageH - 7);
            doc.text(`Page ${p} of ${totalPages}`, pageW - 14, pageH - 7, { align: "right" });
        }

        doc.save(`transcript_${classGroup.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="page-wrapper">
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#fff", borderRadius: 14, padding: "1rem 1.5rem", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: `1.5px solid ${toast.ok ? "var(--success)" : "var(--danger)"}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: toast.ok ? "var(--success-light)" : "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", color: toast.ok ? "var(--success)" : "var(--danger)" }}>
                        {toast.ok ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.msg}</span>
                </div>
            )}

            {/* Bank Edit Modal */}
            {isClient && editingBank && createPortal(
                <div className="modal-overlay" style={{ padding: "1rem" }}>
                    <div className="modal" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Edit Bank Question</h3>
                            <button onClick={() => setEditingBank(null)} style={{ width: 30, height: 30, borderRadius: 7, border: "1.5px solid var(--gray-200)", background: "var(--gray-50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-500)" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <LatexField label="Question Text" value={editingBank.q} onChange={v => setEditingBank({ ...editingBank, q: v })} rows={4} placeholder="Edit question text…" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                            <div>
                                <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>Subject</label>
                                <select value={editingBank.subj} onChange={e => setEditingBank({ ...editingBank, subj: e.target.value })} style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1.5px solid var(--gray-200)", borderRadius: 8, fontSize: "0.875rem", background: "#fff" }}>
                                    <option>Mathematics</option><option>Physics</option><option>Chemistry</option><option>Biology</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>Type</label>
                                <select value={editingBank.type} onChange={e => setEditingBank({ ...editingBank, type: e.target.value })} style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1.5px solid var(--gray-200)", borderRadius: 8, fontSize: "0.875rem", background: "#fff" }}>
                                    <option>Multiple Choice</option><option>Short Answer</option><option>Problem Solving</option><option>True/False</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn btn-secondary" onClick={() => setEditingBank(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveBankEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Evaluate Modal ── */}
            {isClient && evaluating && createPortal(
                <div className="modal-overlay" style={{ padding: "1rem", overflowY: "auto", alignItems: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 820, boxShadow: "0 28px 90px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column", maxHeight: "95vh", overflow: "hidden", zIndex: "var(--z-modal)" }}>

                        {/* ── Modal Header ── */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 1.5rem", borderBottom: "1.5px solid var(--gray-100)", flexShrink: 0 }}>
                            <div>
                                <h3 style={{ fontWeight: 800, fontSize: "1.05rem", margin: 0 }}>Evaluate Student</h3>
                                <div style={{ fontSize: "0.76rem", color: "var(--gray-400)", marginTop: "0.15rem" }}>Score is calculated automatically from assessments below</div>
                            </div>
                            <button onClick={() => setEvaluating(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--gray-200)", background: "var(--gray-50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* ── Course Info Strip ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", background: "var(--gray-50)", borderBottom: "1px solid var(--gray-100)", flexShrink: 0 }}>
                            {[
                                { label: "Course Title", value: evaluating.quiz },
                                { label: "Subject",      value: evaluating.subject },
                                { label: "Student",      value: evaluating.name },
                            ].map((item, i) => (
                                <div key={item.label} style={{ padding: "0.75rem 1.25rem", borderRight: i < 2 ? "1px solid var(--gray-200)" : "none" }}>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{item.label}</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--gray-800)" }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* ── Scrollable body ── */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>

                            {/* Assessment Table */}
                            <div style={{ overflowX: "auto", borderRadius: 12, border: "1.5px solid var(--gray-200)", marginBottom: "1rem" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                    <thead>
                                        <tr style={{ background: "var(--gray-50)" }}>
                                            <th style={{ padding: "0.65rem 0.75rem", textAlign: "left" as const, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-600)", borderBottom: "2px solid var(--gray-200)", width: 36 }}>SN</th>
                                            <th style={{ padding: "0.65rem 0.75rem", textAlign: "left" as const, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-600)", borderBottom: "2px solid var(--gray-200)" }}>Assessment Name</th>
                                            <th style={{ padding: "0.65rem 0.75rem", textAlign: "left" as const, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-600)", borderBottom: "2px solid var(--gray-200)", width: 150 }}>Assessment Type</th>
                                            <th style={{ padding: "0.65rem 0.75rem", textAlign: "center" as const, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-600)", borderBottom: "2px solid var(--gray-200)", width: 110 }}>Maximum Mark</th>
                                            <th style={{ padding: "0.65rem 0.75rem", textAlign: "center" as const, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-600)", borderBottom: "2px solid var(--gray-200)", width: 110 }}>Result</th>
                                            <th style={{ padding: "0.65rem 0.5rem", textAlign: "center" as const, fontWeight: 700, fontSize: "0.75rem", color: "var(--gray-600)", borderBottom: "2px solid var(--gray-200)", width: 34 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {evalAssessments.map((a, i) => (
                                            <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid var(--gray-100)" }}>
                                                <td style={{ padding: "0.45rem 0.75rem", color: "var(--gray-400)", fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}</td>
                                                <td style={{ padding: "0.45rem 0.5rem" }}>
                                                    <input value={a.name}
                                                        onChange={e => setEvalAssessments(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                                                        style={{ width: "100%", padding: "0.3rem 0.55rem", border: "1.5px solid var(--gray-200)", borderRadius: 7, fontSize: "0.83rem", fontFamily: "inherit", boxSizing: "border-box" as const }} />
                                                </td>
                                                <td style={{ padding: "0.45rem 0.5rem" }}>
                                                    <select value={a.type}
                                                        onChange={e => setEvalAssessments(p => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                                                        style={{ width: "100%", padding: "0.3rem 0.5rem", border: "1.5px solid var(--gray-200)", borderRadius: 7, fontSize: "0.83rem", background: "#fff", fontFamily: "inherit" }}>
                                                        <option value="continuous">continuous</option>
                                                        <option value="midterm">midterm</option>
                                                        <option value="quiz">quiz</option>
                                                        <option value="assignment">assignment</option>
                                                        <option value="project">project</option>
                                                        <option value="final">final</option>
                                                        <option value="other">other</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: "0.45rem 0.5rem" }}>
                                                    <input type="number" min={0} value={a.maxMark}
                                                        onChange={e => setEvalAssessments(p => p.map((x, j) => j === i ? { ...x, maxMark: parseFloat(e.target.value) || 0 } : x))}
                                                        style={{ width: "100%", padding: "0.3rem 0.5rem", border: "1.5px solid var(--gray-200)", borderRadius: 7, fontSize: "0.83rem", textAlign: "center" as const, boxSizing: "border-box" as const }} />
                                                </td>
                                                <td style={{ padding: "0.45rem 0.5rem" }}>
                                                    <input type="number" min={0} max={a.maxMark} value={a.result}
                                                        onChange={e => setEvalAssessments(p => p.map((x, j) => j === i ? { ...x, result: parseFloat(e.target.value) || 0 } : x))}
                                                        style={{ width: "100%", padding: "0.3rem 0.5rem", border: `1.5px solid ${a.result > a.maxMark ? "var(--danger)" : "var(--gray-200)"}`, borderRadius: 7, fontSize: "0.83rem", textAlign: "center" as const, boxSizing: "border-box" as const, background: a.result > a.maxMark ? "var(--danger-light)" : "#fff" }} />
                                                </td>
                                                <td style={{ padding: "0.45rem 0.4rem", textAlign: "center" as const }}>
                                                    <button onClick={() => setEvalAssessments(p => p.filter((_, j) => j !== i))}
                                                        style={{ width: 24, height: 24, borderRadius: 5, border: "none", background: "var(--danger-light)", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: "var(--gray-50)", borderTop: "2px solid var(--gray-200)" }}>
                                            <td colSpan={3} style={{ padding: "0.65rem 0.75rem", fontWeight: 700, fontSize: "0.85rem", textAlign: "right" as const, color: "var(--gray-700)" }}>Totals</td>
                                            <td style={{ padding: "0.65rem 0.75rem", textAlign: "center" as const, fontWeight: 800, fontSize: "0.9rem" }}>{evalTotalMax}</td>
                                            <td style={{ padding: "0.65rem 0.75rem", textAlign: "center" as const, fontWeight: 800, fontSize: "0.9rem", color: evalScore >= 90 ? "var(--success)" : evalScore >= 70 ? "var(--primary-600)" : "var(--warning)" }}>
                                                <strong>{evalTotalResult}</strong><span style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: 400 }}>/{evalTotalMax}</span>
                                            </td>
                                            <td />
                                        </tr>
                                        <tr style={{ background: evalScore >= 90 ? "#f0fdf4" : evalScore >= 70 ? "var(--primary-50)" : "#fffbeb" }}>
                                            <td colSpan={6} style={{ padding: "0.6rem 0.75rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" as const }}>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-600)" }}>
                                                        Final Score: <strong style={{ fontSize: "1rem", color: evalScore >= 90 ? "var(--success)" : evalScore >= 70 ? "var(--primary-600)" : "var(--warning)" }}>{evalScore}%</strong>
                                                    </span>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-600)" }}>
                                                        Grade: <strong style={{ fontSize: "1.15rem", color: evalScore >= 90 ? "var(--success)" : evalScore >= 70 ? "var(--primary-600)" : "var(--warning)" }}>{evalGrade}</strong>
                                                    </span>
                                                    {evalTotalMax !== 100 && evalTotalMax > 0 && (
                                                        <span style={{ fontSize: "0.72rem", color: "#b45309", background: "#fef3c7", padding: "0.15rem 0.5rem", borderRadius: 5 }}>⚠ Total max marks = {evalTotalMax} (not 100)</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Add Row */}
                            <button onClick={() => setEvalAssessments(p => [...p, { id: Date.now(), name: "New Assessment", type: "continuous", maxMark: 10, result: 0 }])}
                                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", borderRadius: 8, border: "1.5px dashed var(--primary-300)", background: "var(--primary-50)", color: "var(--primary-600)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", marginBottom: "1.25rem" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Assessment Row
                            </button>

                            {/* Feedback */}
                            <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>Feedback for Student (optional)</label>
                            <textarea value={evalComment} onChange={e => setEvalComment(e.target.value)} rows={3}
                                placeholder="E.g. 'Great work on the mid-term. Focus on exam technique for the final.'"
                                style={{ width: "100%", padding: "0.65rem 0.9rem", border: "1.5px solid var(--gray-200)", borderRadius: 10, fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" as const }} />
                        </div>

                        {/* ── Footer ── */}
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", padding: "1rem 1.5rem", borderTop: "1.5px solid var(--gray-100)", flexShrink: 0 }}>
                            <button className="btn btn-secondary" onClick={() => setEvaluating(null)}>Cancel</button>
                            <button className="btn btn-outline" onClick={() => saveEval(false)}>Save Only</button>
                            <button className="btn btn-primary" onClick={() => saveEval(true)}>Save &amp; Send to Student</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── CSV Column Picker Modal removed ── */}

            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        Exams & Assessments
                    </h1>
                    <p className="page-subtitle">Create quizzes, manage exam bank &amp; student grades</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: "1.5rem" }}>
                <button className={`tab ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>Create Quiz</button>
                <button className={`tab ${activeTab === "bank" ? "active" : ""}`} onClick={() => setActiveTab("bank")}>Exam Bank ({bank.length})</button>
                <button className={`tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")}>Results &amp; Grades</button>
            </div>

            {/* ── CREATE ── */}
            {activeTab === "create" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem", alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* Meta */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: "1rem" }}>Quiz Details</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="input-group"><label>Quiz Title</label><div className="input-field"><input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder={`e.g., ${subject} Chapter Quiz`} /></div></div>
                                <div className="input-group"><label>Subject</label>
                                    <select value={subject} onChange={e => setSubject(e.target.value)} style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", width: "100%" }}>
                                        <option>Mathematics</option><option>Physics</option><option>Chemistry</option><option>Biology</option><option>English</option>
                                    </select>
                                </div>
                                <div className="input-group"><label>Class</label>
                                    <select value={classGroup} onChange={e => setClassGroup(e.target.value)} style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", width: "100%" }}>
                                        <option>Grade 11-A</option><option>Grade 11-B</option><option>Grade 12-A</option><option>Grade 12-B</option>
                                    </select>
                                </div>
                                <div className="input-group"><label>Duration (min)</label><div className="input-field"><input type="number" value={duration} min={5} max={180} onChange={e => setDuration(e.target.value)} /></div></div>
                            </div>
                        </div>

                        {/* Question editor */}
                        <div className="card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <h3 className="card-title">Question {activeQ + 1} of {questions.length}</h3>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>Points:</label>
                                    <input type="number" min={1} max={20} value={q.points} onChange={e => updateQ({ points: parseInt(e.target.value) || 1 })}
                                        style={{ width: 52, padding: "0.3rem 0.5rem", border: "1.5px solid var(--gray-200)", borderRadius: 8, fontSize: "0.85rem", textAlign: "center" as const }} />
                                    {questions.length > 1 && (
                                        <button onClick={() => removeQuestion(activeQ)} style={{ padding: "0.3rem 0.65rem", borderRadius: 8, border: "1.5px solid var(--danger-light)", background: "var(--danger-light)", color: "var(--danger)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Remove</button>
                                    )}
                                </div>
                            </div>

                            {/* Subject-aware field — snippets, tips, placeholder all derived from subject */}
                            <LatexField label="Question Text" value={q.text} onChange={v => updateQ({ text: v })} rows={4} placeholder={SUBJECT_CONFIG[subject]?.placeholder ?? "Type question here…"} subject={subject} />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.875rem" }}>
                                {(["A", "B", "C", "D"] as const).map(opt => (
                                    <LatexField key={opt} label={`Option ${opt}`} value={q.options[opt]} onChange={v => updateQ({ options: { ...q.options, [opt]: v } })} rows={2} placeholder={`Option ${opt}`} mini subject={subject} />
                                ))}
                            </div>

                            <div>
                                <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Correct Answer</label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    {(["A", "B", "C", "D"] as const).map(o => (
                                        <button key={o} onClick={() => updateQ({ correct: o })} className={`btn ${q.correct === o ? "btn-primary" : "btn-secondary"}`} style={{ width: 48, position: "relative" as const }}>
                                            {o}
                                            {q.correct === o && (
                                                <span style={{ position: "absolute", top: -6, right: -6, width: 14, height: 14, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {q.correct && <p style={{ fontSize: "0.78rem", color: "var(--success)", marginTop: "0.4rem", fontWeight: 500 }}>✓ Option {q.correct} is correct</p>}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" onClick={addQuestion} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Question
                            </button>
                            <button className="btn btn-outline" onClick={() => { if (!quizTitle.trim()) { showToast("Enter a title first", false); return; } showToast("Saved to exam bank ✓"); }}>Save to Bank</button>
                            <button className="btn btn-primary" onClick={handlePublish} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9l20-7z" /></svg>
                                Publish Quiz
                            </button>
                        </div>
                    </div>

                    {/* Right: navigator + rendered LaTeX ref */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky" as const, top: "1rem" }}>
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: "0.875rem" }}>Questions</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 380, overflowY: "auto" as const }}>
                                {questions.map((qq, i) => (
                                    <button key={qq.id} onClick={() => setActiveQ(i)} style={{ padding: "0.6rem 0.75rem", borderRadius: 10, textAlign: "left" as const, border: `2px solid ${activeQ === i ? "var(--primary-400)" : "var(--gray-200)"}`, background: activeQ === i ? "var(--primary-50)" : "#fff", cursor: "pointer" }}>
                                        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: activeQ === i ? "var(--primary-600)" : "var(--gray-600)" }}>Q{i + 1}</div>
                                        <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{qq.text ? qq.text.replace(/\$[^$]*\$/g, "[math]").slice(0, 45) : <em>No text yet</em>}</div>
                                        <div style={{ marginTop: 3, display: "flex", gap: "0.25rem" }}>
                                            {qq.correct && <span style={{ fontSize: "0.62rem", padding: "0.1rem 0.35rem", borderRadius: 4, background: "var(--success-light)", color: "#065f46", fontWeight: 600 }}>Ans: {qq.correct}</span>}
                                            <span style={{ fontSize: "0.62rem", padding: "0.1rem 0.35rem", borderRadius: 4, background: "var(--gray-100)", color: "var(--gray-500)" }}>{qq.points}pt</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginTop: "0.875rem", padding: "0.65rem", background: "var(--gray-50)", borderRadius: 10 }}>
                                <div style={{ fontSize: "0.76rem", color: "var(--gray-500)" }}>{questions.length} question(s) · {questions.reduce((s, qq) => s + qq.points, 0)} pts · {duration} min</div>
                            </div>
                        </div>

                        {/* Subject-specific reference card */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: "0.1rem", fontSize: "0.82rem" }}>{SUBJECT_CONFIG[subject]?.icon} {subject} Reference</h3>
                            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>What you type → how it looks</div>
                            {(SUBJECT_CONFIG[subject]?.ref ?? []).map(({ name, tex, note }) => {
                                let rendered = tex;
                                try { rendered = katex.renderToString(tex, { displayMode: false, throwOnError: false }); } catch {}
                                return (
                                    <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.73rem", padding: "0.3rem 0", borderBottom: "1px solid var(--gray-100)", gap: "0.4rem" }}>
                                        <code style={{ color: "var(--primary-700)", background: "var(--primary-50)", padding: "0.1rem 0.35rem", borderRadius: 4, fontSize: "0.68rem", flexShrink: 0, maxWidth: 90 }}>{name}</code>
                                        {note && <span style={{ color: "var(--gray-400)", fontSize: "0.65rem", flex: 1 }}>{note}</span>}
                                        <span dangerouslySetInnerHTML={{ __html: rendered }} />
                                    </div>
                                );
                            })}
                            <div style={{ marginTop: "0.6rem", padding: "0.5rem", background: "var(--primary-50)", borderRadius: 8, fontSize: "0.68rem", color: "var(--primary-700)" }}>
                                Wrap formulas/symbols in <strong>$ dollar signs $</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BANK ── */}
            {activeTab === "bank" && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Exam Bank ({filteredBank.length})</h3>
                        <div className="header-search" style={{ width: 240 }}>
                            <input value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Search questions or subject…" />
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Question</th><th>Subject</th><th>Type</th><th>Used</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filteredBank.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ maxWidth: 320 }}><div dangerouslySetInnerHTML={{ __html: renderLatex(item.q) }} style={{ fontSize: "0.875rem", fontWeight: 500 }} /></td>
                                        <td><span className="badge badge-primary">{item.subj}</span></td>
                                        <td style={{ fontSize: "0.85rem" }}>{item.type}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{item.used}×</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.375rem" }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => setEditingBank({ ...item })}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => useFromBank(item)}>Use</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBank.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem", fontStyle: "italic" }}>No questions match your search.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── RESULTS ── */}
            {activeTab === "results" && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Student Results</h3>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                const now = new Date().toISOString().slice(0, 10);
                                const updated = results.map(r => r.sent ? r : { ...r, sent: true, sentAt: now });
                                setResults(updated);
                                updated.forEach(r => storeSendGrade({ studentName: r.name, quizTitle: r.quiz, subject: r.subject, score: r.score, grade: r.grade, comment: r.comment, sentAt: r.sentAt }));
                                showToast("All grades sent ✓");
                            }}>Send All Grades</button>
                            <button className="btn btn-outline btn-sm" onClick={downloadPDF} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download PDF
                            </button>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>Grade</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {results.map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{s.quiz}</td>
                                        <td style={{ fontWeight: 700, color: s.score >= 90 ? "var(--success)" : s.score >= 80 ? "var(--primary-600)" : "var(--warning)" }}>{s.score}%</td>
                                        <td><span className={`badge ${s.score >= 90 ? "badge-success" : s.score >= 80 ? "badge-primary" : "badge-warning"}`}>{s.grade}</span></td>
                                        <td>{s.sent ? <span className="badge badge-success">Sent</span> : <span className="badge badge-warning">Pending</span>}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.375rem" }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => openEvaluate(s)}>Evaluate</button>
                                                {!s.sent && <button className="btn btn-primary btn-sm" onClick={() => {
                                                    const now = new Date().toISOString().slice(0, 10);
                                                    const updated = { ...s, sent: true, sentAt: now };
                                                    setResults(p => p.map((r, ri) => ri === i ? updated : r));
                                                    storeSendGrade({ studentName: updated.name, quizTitle: updated.quiz, subject: updated.subject, score: updated.score, grade: updated.grade, comment: updated.comment, sentAt: updated.sentAt });
                                                    showToast(`Grade sent to ${s.name} ✓`);
                                                }}>Send Grade</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

