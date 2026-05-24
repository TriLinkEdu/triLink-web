"use client";
import React, { useState, useRef, useEffect, ReactNode, ChangeEvent } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  direction?: "up" | "down";
  dropdownMinWidth?: string;
  optionTextAlign?: "left" | "center" | "right";
  optionPadding?: string;
}

export default function Select({
  children,
  value,
  onChange,
  disabled,
  style,
  className,
  id,
  direction = "down",
  dropdownMinWidth = "100%",
  optionTextAlign = "left",
  optionPadding = "0.5rem 0.8rem"
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  const options: { value: string; label: ReactNode; disabled?: boolean }[] = [];

  // Recursively extract options
  function extractOptions(node: ReactNode) {
    React.Children.forEach(node, (child) => {
      if (React.isValidElement<{ value?: unknown; children?: ReactNode; disabled?: boolean }>(child)) {
        if (child.type === 'option') {
          const val = child.props.value ?? child.props.children;
          options.push({
            value: String(val),
            label: child.props.children,
            disabled: child.props.disabled
          });
        } else if (child.props.children) {
          // If it's a Fragment or array inside, drill down
          extractOptions(child.props.children);
        }
      } else if (Array.isArray(child)) {
        child.forEach(subChild => extractOptions(subChild));
      }
    });
  }

  extractOptions(children);

  const selectedOption = options.find((o) => o.value === String(value));

  const handleSelect = (val: string) => {
    if (onChange) {
      const e = {
        target: { value: val },
        currentTarget: { value: val },
        preventDefault: () => { },
        stopPropagation: () => { },
      } as unknown as ChangeEvent<HTMLSelectElement>;
      onChange(e);
    }
    setOpen(false);
  };

  // Split style into wrapper and button styles
  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    border: disabled ? "1.5px solid var(--gray-200)" : hovered ? "1.5px solid var(--primary-500)" : "1.5px solid rgba(37, 99, 235, 0.25)",
    background: disabled ? "var(--gray-50)" : hovered ? "#fff" : "linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)",
    borderRadius: "12px",
    padding: "0.55rem 0.85rem",
    boxShadow: hovered ? "0 4px 12px rgba(37, 99, 235, 0.08)" : "0 1px 2px rgba(37, 99, 235, 0.03)",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center"
  };
  const buttonStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: "none",
    border: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "inherit",
    fontWeight: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    color: "inherit",
    textAlign: "left"
  };

  if (style) {
    const layoutKeys = [
      "width", "minWidth", "maxWidth", "flex", "flexGrow", "flexShrink", "flexBasis",
      "margin", "marginLeft", "marginRight", "marginTop", "marginBottom",
      "position", "display", "gridArea", "alignSelf", "justifySelf",
      "left", "right", "top", "bottom", "zIndex"
    ];
    Object.entries(style).forEach(([key, val]) => {
      if (layoutKeys.includes(key)) {
        (wrapperStyle as any)[key] = val;
      } else {
        (buttonStyle as any)[key] = val;
      }
    });
  }

  return (
    <div
      ref={ref}
      className={className}
      style={wrapperStyle}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        style={buttonStyle}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : "Select..."}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: 8, flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          ...(direction === "up" ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
          left: 0, right: 0,
          background: "linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)",
          border: "1px solid rgba(37, 99, 235, 0.15)",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(37, 99, 235, 0.12), 0 1px 3px rgba(37, 99, 235, 0.05)",
          maxHeight: "320px", overflowY: "auto", zIndex: 99999,
          padding: "6px", display: "flex", flexDirection: "column", gap: "4px",
          minWidth: dropdownMinWidth
        }}>
          {options.length === 0 ? (
            <div style={{ padding: "0.6rem 1rem", color: "var(--gray-500)", fontSize: "0.9rem" }}>No options</div>
          ) : (
            options.map((opt, i) => {
              const isSelected = String(value) === String(opt.value);
              return (
                <button
                  key={`${opt.value}-${i}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    width: "100%", padding: optionPadding, textAlign: optionTextAlign,
                    background: isSelected ? "rgba(37, 99, 235, 0.08)" : "transparent",
                    color: isSelected ? "var(--primary-700)" : "var(--gray-800)",
                    border: "none", borderRadius: "8px",
                    cursor: opt.disabled ? "not-allowed" : "pointer",
                    fontSize: "0.9rem", fontWeight: isSelected ? 700 : 600,
                    display: "block", outline: "none",
                    transition: "all 0.15s ease"
                  }}
                  onMouseOver={(e) => {
                    if (!opt.disabled && !isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(37, 99, 235, 0.05)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--primary-600)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!opt.disabled && !isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--gray-800)";
                    }
                  }}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
