"use client";

/**
 * PlaceholderPage — 1:1 port of the TRILINK kit's `<PlaceholderPage/>`
 * (`extras.jsx` lines 403–416). Use for any role/page that isn't yet
 * built out — keeps the same PageHead + empty-card aesthetic the kit uses.
 */
import { Icon, PageHead, type KitIconName } from "@/components/kit";

interface PlaceholderPageProps {
    title: string;
    sub?: string;
    icon?: KitIconName;
    role?: "student" | "teacher" | "admin" | "parent";
}

export function PlaceholderPage({
    title,
    sub,
    icon = "layers",
    role,
}: PlaceholderPageProps) {
    return (
        <div className="kit-page" data-role={role}>
            <PageHead
                title={title}
                sub={sub}
                actions={
                    <button type="button" className="btn-kit btn-kit-primary">
                        <Icon name="plus" /> New
                    </button>
                }
            />
            <div className="k-card">
                <div className="empty-card">
                    <Icon name={icon} size={28} />
                    <div className="empty-card__t">{title}</div>
                    <div className="empty-card__b">
                        The full {title.toLowerCase()} surface lives here. Use the sidebar to navigate
                        to the dashboards we&rsquo;ve designed in detail.
                    </div>
                </div>
            </div>
        </div>
    );
}
