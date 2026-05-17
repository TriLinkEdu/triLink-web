"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface SearchableOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  alphabetize?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  label,
  disabled = false,
  style,
  alphabetize = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort options alphabetically if enabled
  const sortedOptions = useMemo(() => {
    if (!alphabetize) return options;
    return [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [options, alphabetize]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return sortedOptions;
    const term = searchTerm.toLowerCase();
    return sortedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.subtitle?.toLowerCase().includes(term)
    );
  }, [sortedOptions, searchTerm]);

  // Find selected option label
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ width: "100%", ...style }}>
      {label && (
        <label style={{ display: "block", marginBottom: 4, fontSize: "0.875rem", fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.6rem 1rem",
            borderRadius: "20px",
            border: "1px solid var(--primary-200)",
            background: disabled ? "var(--gray-100)" : "var(--primary-50)",
            color: disabled ? "var(--gray-400)" : "var(--primary-800)",
            cursor: disabled ? "not-allowed" : "pointer",
            fontWeight: 500,
            outline: "none",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedOption ? (
              <span>
                {selectedOption.label}
                {selectedOption.subtitle && (
                  <span style={{ color: "var(--gray-500)", fontSize: "0.85em", marginLeft: 8 }}>
                    ({selectedOption.subtitle})
                  </span>
                )}
              </span>
            ) : (
              <span style={{ color: "var(--gray-400)" }}>{placeholder}</span>
            )}
          </span>
          <ChevronDown
            size={16}
            style={{
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
              marginLeft: 8,
            }}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid var(--gray-200)",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxHeight: "320px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Search input */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--gray-100)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search size={16} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "0.9rem",
                  background: "transparent",
                  color: "var(--gray-800)",
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--gray-400)",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Options list */}
            <div
              style={{
                overflowY: "auto",
                maxHeight: "240px",
                padding: "4px 0",
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--gray-400)",
                    fontSize: "0.875rem",
                  }}
                >
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      textAlign: "left",
                      border: "none",
                      background: option.value === value ? "var(--primary-50)" : "transparent",
                      color: option.value === value ? "var(--primary-800)" : "var(--gray-700)",
                      cursor: "pointer",
                      fontWeight: option.value === value ? 600 : 400,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (option.value !== value) {
                        e.currentTarget.style.background = "var(--gray-50)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (option.value !== value) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>{option.label}</span>
                    {option.subtitle && (
                      <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                        {option.subtitle}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Results count */}
            {filteredOptions.length > 0 && (
              <div
                style={{
                  padding: "8px 16px",
                  borderTop: "1px solid var(--gray-100)",
                  fontSize: "0.75rem",
                  color: "var(--gray-400)",
                  textAlign: "center",
                }}
              >
                {filteredOptions.length} of {sortedOptions.length} option
                {sortedOptions.length !== 1 ? "s" : ""}
                {alphabetize && " (alphabetized)"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
