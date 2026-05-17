/**
 * Tabs — TRILINK kit underline tabs, exact port.
 *
 * Usage:
 *   <Tabs
 *     tabs={[{ id: "all", label: "All", count: 6 }, …]}
 *     active="all"
 *     onChange={setFilter}
 *   />
 */
export interface TabSpec {
    id: string;
    label: string;
    count?: number;
}

export interface TabsProps {
    tabs: readonly TabSpec[];
    active: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
    return (
        <div className={`k-tabs ${className ?? ""}`.trim()} role="tablist">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active === t.id}
                    className={`k-tab ${active === t.id ? "active" : ""}`}
                    onClick={() => onChange(t.id)}
                >
                    {t.label}
                    {t.count != null ? <span className="k-tab__count">{t.count}</span> : null}
                </button>
            ))}
        </div>
    );
}
