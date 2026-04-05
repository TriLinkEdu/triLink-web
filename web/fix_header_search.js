const fs = require('fs');

let c = fs.readFileSync('src/components/Header.tsx', 'utf8');

// 1. Add state for suggestions & closing on click outside
if (!c.includes('const [suggestions, setSuggestions] = useState')) {
  c = c.replace(
    'const [showUserMenu, setShowUserMenu] = useState(false);',
    'const [showUserMenu, setShowUserMenu] = useState(false);\n    const [suggestions, setSuggestions] = useState<{ href: string; label: string }[]>([]);\n    const [showSuggestions, setShowSuggestions] = useState(false);\n    const searchRef = useRef<HTMLDivElement>(null);'
  );

  // Add click outside for search
  c = c.replace(
    'useEffect(() => {\n        function handleClickOutside(event: MouseEvent) {',
    'useEffect(() => {\n        function handleClickOutside(event: MouseEvent) {\n            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {\n                setShowSuggestions(false);\n            }'
  );
}

// 2. Add dynamic suggestion logic
if (!c.includes('useEffect(() => {\n        if (!searchText.trim()')) {
  c = c.replace(
    'const { toast, setToast } = useRealtimeNotifications(userId, userName);',
    'const { toast, setToast } = useRealtimeNotifications(userId, userName);\n\n    useEffect(() => {\n        const q = searchText.trim().toLowerCase();\n        if (q.length < 2) {\n            setSuggestions([]);\n            return;\n        }\n        const rts = roleRoutes[role] || [];\n        const filtered = rts.filter(r => \n            r.href.toLowerCase().includes(q) || \n            r.keywords.some(k => k.toLowerCase().includes(q)) ||\n            (r.href.split("/").pop() || "").includes(q)\n        ).map(r => ({\n            href: r.href,\n            label: r.href.split("/").pop()?.replace(/-/g, " ").replace(/^\\w/, c => c.toUpperCase()) || "Page"\n        }));\n        setSuggestions(filtered.slice(0, 5));\n        setShowSuggestions(true);\n    }, [searchText, role]);'
  );
}

// 3. Improve the JSX
// Replace the search container part
const searchJSX = `<div className="header-search">
                <button type="button" className="header-search-btn" onClick={submitSearch} aria-label="Search">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </button>
                <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submitSearch();
                        }
                    }}
                />
            </div>`;

const newSearchJSX = `<div className="header-search" ref={searchRef} style={{ position: "relative" }}>
                <button type="button" className="header-search-btn" onClick={submitSearch} aria-label="Search">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </button>
                <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchText}
                    onFocus={() => searchText.trim().length >= 2 && setShowSuggestions(true)}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submitSearch();
                            setShowSuggestions(false);
                        }
                        if (e.key === "Escape") setShowSuggestions(false);
                    }}
                    style={{ background: "none", border: "none", outline: "none", flex: 1 }}
                />
                {searchText && (
                    <button 
                        type="button" 
                        onClick={() => { setSearchText(""); setSuggestions([]); setShowSuggestions(false); }}
                        style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", padding: "4px" }}
                    >
                        <X size={14} />
                    </button>
                )}

                {showSuggestions && suggestions.length > 0 && (
                    <div className="search-suggestions" style={{
                        position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                        background: "#fff", borderRadius: 12, zIndex: 2000,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                        border: "1px solid var(--gray-100)",
                        overflow: "hidden", padding: "6px"
                    }}>
                        {suggestions.map(s => (
                            <button
                                key={s.href}
                                onClick={() => {
                                    router.push(s.href);
                                    setShowSuggestions(false);
                                    setSearchText("");
                                }}
                                style={{
                                    width: "100%", textAlign: "left", padding: "10px 14px",
                                    background: "none", border: "none", borderRadius: 8,
                                    fontSize: "0.875rem", cursor: "pointer", transition: "all 0.15s"
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = "var(--gray-50)")}
                                onMouseOut={e => (e.currentTarget.style.background = "none")}
                            >
                                <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{s.label}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{s.href}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>`;

// Add X icon to imports
if (!c.includes('import { X } from "lucide-react";')) {
    c = c.replace(
        'import { authFetch } from "@/lib/auth";',
        'import { authFetch } from "@/lib/auth";\nimport { X } from "lucide-react";'
    );
}

// Perform replacement
// Note: We need to handle potential whitespace differences in searchJSX
if (!c.includes('showSuggestions')) {
    // Try to find the container div by its start
    c = c.replace(/<div className="header-search">[\s\S]+?<\/div>/, newSearchJSX);
}

fs.writeFileSync('src/components/Header.tsx', c);
console.log('SUCCESS: Header search improved with suggestions and clear button');
