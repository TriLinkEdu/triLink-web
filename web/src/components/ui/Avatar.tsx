"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { getApiBase } from "@/lib/api";

interface AvatarProps {
    initials: string;
    name?: string;
    fileId?: string | null;
    size?: number;
    rounded?: "full" | "md";
}

export function Avatar({ initials, name, fileId, size = 40, rounded = "full" }: AvatarProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [errored, setErrored] = useState(false);
    const radius = rounded === "full" ? "9999px" : "10px";
    const fontSize = Math.max(10, Math.round(size * 0.4));

    useEffect(() => {
        let cancelled = false;
        let currentBlob: string | null = null;
        setErrored(false);
        setBlobUrl(null);
        if (!fileId) return;
        (async () => {
            try {
                const res = await authFetch(`${getApiBase()}/api/files/${fileId}/download`, { method: "GET" });
                if (!res.ok || cancelled) {
                    if (!cancelled) setErrored(true);
                    return;
                }
                const blob = await res.blob();
                if (cancelled) return;
                currentBlob = URL.createObjectURL(blob);
                setBlobUrl(currentBlob);
            } catch {
                if (!cancelled) setErrored(true);
            }
        })();
        return () => {
            cancelled = true;
            if (currentBlob) URL.revokeObjectURL(currentBlob);
        };
    }, [fileId]);

    const showImage = !!blobUrl && !errored;

    return (
        <div
            className="ui-avatar"
            style={{ width: size, height: size, borderRadius: radius, fontSize }}
            aria-label={name || "User avatar"}
            role="img"
        >
            {showImage ? (
                <img
                    src={blobUrl!}
                    alt={name || "Avatar"}
                    onError={() => setErrored(true)}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: radius }}
                />
            ) : (
                <span aria-hidden>{initials}</span>
            )}
        </div>
    );
}
