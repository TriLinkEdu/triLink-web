/**
 * KAvatar — TRILINK kit's flat single-tone avatar, exact port.
 *
 *   <KAvatar initials="MC" size="xl" tone="filled" />
 */
export interface KAvatarProps {
    initials: string;
    size?: "sm" | "lg" | "xl";
    tone?: "default" | "brand" | "filled";
    className?: string;
}

export function KAvatar({
    initials,
    size = "sm",
    tone = "default",
    className,
}: KAvatarProps) {
    const cls = [
        "k-avatar",
        size === "lg" ? "k-avatar--lg" : size === "xl" ? "k-avatar--xl" : "",
        tone === "brand" ? "k-avatar--brand" : tone === "filled" ? "k-avatar--filled" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");
    return <span className={cls}>{initials}</span>;
}
