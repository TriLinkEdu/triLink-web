"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DataTableColumn<T> {
    /** Stable key, also used as `aria-sort` target. */
    key: string;
    /** Column header label. */
    header: React.ReactNode;
    /** Render the cell value. */
    cell: (row: T, rowIndex: number) => React.ReactNode;
    /** Cell alignment. Numeric columns should be `right`. */
    align?: "left" | "center" | "right";
    /** Fixed width (px) or any CSS length. */
    width?: number | string;
    /** Enable sort for this column (caller still owns the sort state). */
    sortable?: boolean;
    className?: string;
}

export interface SortState {
    key: string;
    dir: "asc" | "desc";
}

export interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows: T[];
    /** Stable id accessor — required for keys & selection. */
    rowKey: (row: T, index: number) => string;
    /** Row click handler. When provided, rows become buttons (full-width). */
    onRowClick?: (row: T) => void;
    /** Hover-revealed actions cell (e.g. a `…` menu). */
    rowActions?: (row: T) => React.ReactNode;
    /** Currently-sorted column. */
    sort?: SortState;
    onSortChange?: (next: SortState) => void;
    /** Loading state — renders a row-skeleton placeholder. */
    loading?: boolean;
    skeletonRows?: number;
    /** Empty state — rendered when `!loading && rows.length === 0`. */
    empty?: React.ReactNode;
    /** Density tier. */
    density?: "comfortable" | "compact";
    /** Stick the header to the top of the scroll container. */
    stickyHeader?: boolean;
    className?: string;
    "aria-label"?: string;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right tabular-nums",
};

/**
 * DataTable — the canonical list surface.
 *
 * Visual rules (Linear / Stripe / Vercel parity):
 *  - No zebra stripes. Hairline row dividers only.
 *  - Header is uppercase 11 px tracked, only the active sort column shows a chevron.
 *  - Row height 44 px comfortable / 36 px compact.
 *  - Tabular numerals on numeric columns.
 *  - Row actions are revealed on row hover, never persistent.
 *  - Empty state is a centered illustration + headline + CTA (caller supplies).
 *
 * This is a *headless-ish* primitive: sort state is owned by the caller so
 * the same component can drive server- and client-side sorting.
 */
export function DataTable<T>({
    columns,
    rows,
    rowKey,
    onRowClick,
    rowActions,
    sort,
    onSortChange,
    loading,
    skeletonRows = 6,
    empty,
    density = "comfortable",
    stickyHeader,
    className,
    "aria-label": ariaLabel,
}: DataTableProps<T>) {
    const cellPad = density === "compact" ? "h-9 px-3" : "h-11 px-4";
    const handleSort = (col: DataTableColumn<T>) => {
        if (!col.sortable || !onSortChange) return;
        if (sort?.key === col.key) {
            onSortChange({ key: col.key, dir: sort.dir === "asc" ? "desc" : "asc" });
        } else {
            onSortChange({ key: col.key, dir: "asc" });
        }
    };

    const isEmpty = !loading && rows.length === 0;

    return (
        <div
            className={cn(
                "overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)]",
                className,
            )}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm" aria-label={ariaLabel}>
                    <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-[var(--color-bg-elev)]")}>
                        <tr className="border-b border-[var(--color-border)]">
                            {columns.map((col) => {
                                const active = sort?.key === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        scope="col"
                                        style={col.width ? { width: col.width } : undefined}
                                        aria-sort={
                                            active
                                                ? sort?.dir === "asc"
                                                    ? "ascending"
                                                    : "descending"
                                                : col.sortable
                                                    ? "none"
                                                    : undefined
                                        }
                                        className={cn(
                                            "h-10 px-4 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-fg-subtle)]",
                                            alignClass[col.align ?? "left"],
                                            col.sortable && "cursor-pointer select-none hover:text-[var(--color-fg)]",
                                            col.className,
                                        )}
                                        onClick={col.sortable ? () => handleSort(col) : undefined}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.header}
                                            {active ? (
                                                sort?.dir === "asc" ? (
                                                    <ChevronUp className="h-3 w-3 text-[var(--color-fg)]" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3 text-[var(--color-fg)]" />
                                                )
                                            ) : null}
                                        </span>
                                    </th>
                                );
                            })}
                            {rowActions ? (
                                <th scope="col" className="w-12" aria-label="Row actions" />
                            ) : null}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: skeletonRows }).map((_, i) => (
                                <tr
                                    key={`sk-${i}`}
                                    className="border-b border-[var(--color-border)] last:border-b-0"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn(cellPad)}>
                                            <div className="h-3.5 w-[60%] rounded bg-[var(--color-muted)]" />
                                        </td>
                                    ))}
                                    {rowActions ? <td /> : null}
                                </tr>
                            ))
                            : rows.map((row, i) => (
                                <tr
                                    key={rowKey(row, i)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={cn(
                                        "group border-b border-[var(--color-border)] last:border-b-0",
                                        "transition-colors",
                                        onRowClick
                                            ? "cursor-pointer hover:bg-[var(--color-muted)]"
                                            : "hover:bg-[color-mix(in_oklab,var(--color-muted)_50%,transparent)]",
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                cellPad,
                                                "align-middle text-[var(--color-fg)]",
                                                alignClass[col.align ?? "left"],
                                                col.className,
                                            )}
                                        >
                                            {col.cell(row, i)}
                                        </td>
                                    ))}
                                    {rowActions ? (
                                        <td className={cn(cellPad, "w-12 text-right")}>
                                            <div className="invisible group-hover:visible group-focus-within:visible">
                                                {rowActions(row)}
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            {isEmpty ? (
                <div className="border-t border-[var(--color-border)]">
                    {empty ?? (
                        <div className="px-8 py-16 text-center text-sm text-[var(--color-fg-muted)]">
                            No results.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
