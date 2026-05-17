"use client";
/* eslint-disable react/forbid-dom-props -- kit ports preserve inline styles from the source kit. */

/**
 * AnnouncementsKitPage — 1:1 port of the TRILINK kit's
 * `<AnnouncementsPage role="…"/>` (`extras.jsx` lines 9–127).
 *
 * One component, parameterised by `role`. Composes the kit's "compose"
 * card (only for admin/teacher) and the all-announcements list, with our
 * real `listAnnouncements()` / `announcementsForMe()` data wired in.
 */
import { useEffect, useMemo, useState } from "react";
import {
    Icon,
    PageHead,
    Pill,
    type PillKind,
} from "@/components/kit";
import {
    KField,
    KitErrorBanner,
    KitInput,
    KitSelect,
    KitTextarea,
} from "@/components/kit/local";
import {
    announcementsForMe,
    createAnnouncement,
    getActiveAcademicYear,
    listAnnouncements,
    listGrades,
    listSections,
    type Announcement,
    type Grade,
    type Section,
} from "@/lib/admin-api";

export type AnnouncementsRole = "student" | "teacher" | "admin" | "parent";

interface AnnouncementsKitPageProps {
    role: AnnouncementsRole;
}

function formatDateChip(iso: string) {
    const d = new Date(iso);
    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (sameDay(d, now)) return `Today · ${time}`;
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function AnnouncementsKitPage({ role }: AnnouncementsKitPageProps) {
    const canCompose = role === "admin" || role === "teacher";
    const [items, setItems] = useState<Announcement[]>([]);
    const [academicYearId, setAcademicYearId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [showCompose, setShowCompose] = useState(false);

    /* compose state */
    const [headline, setHeadline] = useState("");
    const [msg, setMsg] = useState("");
    const [audience, setAudience] = useState("all");
    const [scopeGrade, setScopeGrade] = useState<string>("");
    const [scopeSection, setScopeSection] = useState<string>("");
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [publishing, setPublishing] = useState(false);

    /* list filters */
    const [search, setSearch] = useState("");
    const [audienceFilter, setAudienceFilter] = useState<string>("all");

    const load = async () => {
        setLoading(true);
        try {
            const year = await getActiveAcademicYear().catch(() => null);
            setAcademicYearId(year?.id ?? null);
            const data =
                role === "admin"
                    ? await listAnnouncements(year?.id)
                    : await announcementsForMe();
            setItems(data);
            setErr(null);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not load announcements");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    useEffect(() => {
        if (!canCompose) return;
        void (async () => {
            try {
                const [g, s] = await Promise.all([listGrades(), listSections()]);
                setGrades(g);
                setSections(s);
            } catch {
                /* swallow */
            }
        })();
    }, [canCompose]);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!headline.trim() || !academicYearId) return;
        setPublishing(true);
        try {
            const payload: Parameters<typeof createAnnouncement>[0] = {
                academicYearId,
                title: headline.trim(),
                body: msg.trim() || headline.trim(),
                audience,
            };
            if (scopeGrade) {
                const g = grades.find((x) => x.id === scopeGrade);
                if (g) payload.targetGrade = g.name;
            }
            if (scopeSection) {
                const s = sections.find((x) => x.id === scopeSection);
                if (s) payload.targetSection = s.name;
            }
            await createAnnouncement(payload);
            setHeadline("");
            setMsg("");
            setScopeGrade("");
            setScopeSection("");
            setShowCompose(false);
            void load();
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Couldn't publish announcement");
        } finally {
            setPublishing(false);
        }
    };

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((it) => {
            if (audienceFilter !== "all" && it.audience !== audienceFilter) return false;
            if (!q) return true;
            return (
                it.title.toLowerCase().includes(q) ||
                it.body.toLowerCase().includes(q)
            );
        });
    }, [items, search, audienceFilter]);

    const onExport = () => {
        const lines: string[] = ["Date,Title,Audience,Grade,Section,Body"];
        const esc = (s: string | null | undefined) =>
            s == null ? "" : `"${String(s).replace(/"/g, '""')}"`;
        for (const it of filteredItems) {
            lines.push(
                [
                    esc(new Date(it.createdAt).toISOString()),
                    esc(it.title),
                    esc(it.audience),
                    esc(it.targetGrade),
                    esc(it.targetSection),
                    esc(it.body),
                ].join(","),
            );
        }
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const u = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = u;
        a.download = `announcements-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(u);
    };

    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Communication <span className="dot-sep">·</span> {items.length} total
                    </>
                }
                title="Announcements"
                sub="Reach the whole school, a year, or a single class."
                actions={
                    <>
                        <button
                            type="button"
                            className="btn-kit btn-kit-secondary"
                            onClick={onExport}
                            disabled={filteredItems.length === 0}
                        >
                            <Icon name="download" /> Export
                        </button>
                        {canCompose ? (
                            <button
                                type="button"
                                className="btn-kit btn-kit-primary"
                                onClick={() => setShowCompose((v) => !v)}
                            >
                                <Icon name="plus" /> New
                            </button>
                        ) : null}
                    </>
                }
            />

            {err ? <KitErrorBanner message={err} /> : null}

            {showCompose && canCompose ? (
                <form
                    className="k-card"
                    onSubmit={handlePublish}
                    style={{
                        marginBottom: 14,
                        background: "var(--brand-faint)",
                        borderColor: "rgba(91,91,214,0.16)",
                    }}
                >
                    <div className="k-card__head" style={{ borderColor: "rgba(91,91,214,0.16)" }}>
                        <div>
                            <div className="k-card__title">Compose announcement</div>
                            <div className="k-card__sub">Will broadcast in-app &amp; via email</div>
                        </div>
                        <button
                            type="button"
                            className="iconbtn"
                            onClick={() => setShowCompose(false)}
                            aria-label="Close composer"
                            title="Close"
                            style={{ width: 26, height: 26, fontSize: 16, lineHeight: 1 }}
                        >
                            ×
                        </button>
                    </div>
                    <div
                        className="k-card__body"
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
                    >
                        <div style={{ gridColumn: "1 / -1" }}>
                            <KField label="Headline" required>
                                <KitInput
                                    placeholder="e.g. Pop quiz on Friday"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                />
                            </KField>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <KField label="Message">
                                <KitTextarea
                                    placeholder="Type your announcement…"
                                    value={msg}
                                    onChange={(e) => setMsg(e.target.value)}
                                    rows={4}
                                />
                            </KField>
                        </div>
                        <KField label="Audience">
                            <KitSelect
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                            >
                                <option value="all">All school</option>
                                <option value="students">Students</option>
                                <option value="teachers">Teachers</option>
                                <option value="parents">Parents</option>
                            </KitSelect>
                        </KField>
                        <KField label="Grade" hint="Leave empty to target all grades">
                            <KitSelect
                                value={scopeGrade}
                                onChange={(e) => setScopeGrade(e.target.value)}
                            >
                                <option value="">All grades</option>
                                {grades.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </KitSelect>
                        </KField>
                        <KField label="Section" hint="Leave empty to target all sections in the grade">
                            <KitSelect
                                value={scopeSection}
                                onChange={(e) => setScopeSection(e.target.value)}
                            >
                                <option value="">All sections</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </KitSelect>
                        </KField>
                        <div
                            style={{
                                gridColumn: "1 / -1",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 6,
                            }}
                        >
                            <button
                                type="button"
                                className="btn-kit btn-kit-secondary"
                                onClick={() => setShowCompose(false)}
                                disabled={publishing}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-kit btn-kit-primary"
                                disabled={publishing || !headline.trim()}
                            >
                                <Icon name="paperPlane" />{" "}
                                {publishing ? "Publishing…" : "Publish"}
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}

            <div className="k-card">
                <div className="k-card__head">
                    <div>
                        <div className="k-card__title">All announcements</div>
                        <div className="k-card__sub">
                            {filteredItems.length} of {items.length} · most recent first
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ width: 160 }}>
                            <KitSelect
                                value={audienceFilter}
                                onChange={(e) => setAudienceFilter(e.target.value)}
                            >
                                <option value="all">All audiences</option>
                                <option value="students">Students</option>
                                <option value="teachers">Teachers</option>
                                <option value="parents">Parents</option>
                            </KitSelect>
                        </div>
                        <div style={{ width: 220, position: "relative" }}>
                            <Icon
                                name="search"
                                size={12}
                                className="absolute"
                            />
                            <KitInput
                                placeholder="Search announcements…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: 28 }}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    {loading ? (
                        <div className="empty-card">
                            <div className="skel" style={{ height: 18, width: 240, margin: "8px auto" }} />
                            <div className="skel" style={{ height: 14, width: 320, margin: "8px auto" }} />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="empty-card">
                            <Icon name="megaphone" size={28} />
                            <div className="empty-card__t">
                                {items.length === 0 ? "No announcements yet" : "No matches"}
                            </div>
                            <div className="empty-card__b">
                                {items.length === 0
                                    ? "When the school publishes new updates, they'll show up here."
                                    : "Try a different search or audience filter."}
                            </div>
                        </div>
                    ) : (
                        filteredItems.map((it, i) => {
                            const audienceLabel = it.audience === "all" ? "All school" : it.audience;
                            const audiencePillKind: PillKind = "neutral";
                            return (
                                <div
                                    key={it.id}
                                    style={{
                                        padding: "14px 16px",
                                        borderBottom: i < filteredItems.length - 1 ? "1px solid var(--hairline)" : "0",
                                        display: "grid",
                                        gridTemplateColumns: "110px 1fr auto",
                                        gap: 16,
                                        alignItems: "start",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11.5,
                                            color: "var(--ink-3)",
                                            fontVariantNumeric: "tabular-nums",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {formatDateChip(it.createdAt)}
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 13.5,
                                                fontWeight: 500,
                                                color: "var(--ink)",
                                                marginBottom: 4,
                                                letterSpacing: "-0.008em",
                                            }}
                                        >
                                            {it.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12.5,
                                                color: "var(--ink-2)",
                                                lineHeight: 1.55,
                                                marginBottom: 6,
                                                maxWidth: 640,
                                                letterSpacing: "-0.003em",
                                            }}
                                        >
                                            {it.body}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center",
                                                fontSize: 11.5,
                                                color: "var(--ink-3)",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Pill kind={audiencePillKind}>{audienceLabel}</Pill>
                                            {it.targetGrade ? (
                                                <>
                                                    <span className="dot-sep">·</span>
                                                    <span>{it.targetGrade}</span>
                                                </>
                                            ) : null}
                                            {it.classOffering?.subject?.name ? (
                                                <>
                                                    <span className="dot-sep">·</span>
                                                    <span>{it.classOffering.subject.name}</span>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-end",
                                            gap: 6,
                                        }}
                                    >
                                        <Pill kind="active">Live</Pill>
                                        <button
                                            type="button"
                                            className="btn-kit btn-kit-ghost"
                                            style={{ fontSize: 11.5 }}
                                        >
                                            Open <Icon name="chev" size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
