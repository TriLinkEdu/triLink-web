"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { getApiBase } from "@/lib/api";

interface AuthenticatedAvatarProps {
  fileId?: string | null;
  initials?: string;
  size?: number | string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * A central component for user avatars that handles authenticated photo loading.
 * Miraculously fixes "broken image" issues caused by secure file endpoints.
 */
export default function AuthenticatedAvatar({
  fileId,
  initials,
  size = 36,
  className = "",
  alt = "User",
  style = {},
}: AuthenticatedAvatarProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let currentBlob: string | null = null;

    if (!fileId) {
      setBlobUrl(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${getApiBase()}/api/files/${fileId}/download`, {
          method: "GET",
        });
        if (!res.ok || cancelled) throw new Error("Load failed");
        
        const blob = await res.blob();
        if (cancelled) return;

        currentBlob = URL.createObjectURL(blob);
        setBlobUrl(currentBlob);
      } catch {
        if (!cancelled) setBlobUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (currentBlob) URL.revokeObjectURL(currentBlob);
    };
  }, [fileId]);

  const sizePx = typeof size === "number" ? `${size}px` : size;

  if (blobUrl) {
    return (
      <img
        src={blobUrl}
        alt={alt}
        className={`avatar ${className}`}
        style={{
          width: sizePx,
          height: sizePx,
          objectFit: "cover",
          borderRadius: "50%",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-initials ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "var(--gray-100)",
        color: "var(--gray-500)",
        fontSize: "0.85rem",
        borderRadius: "50%",
        fontWeight: 600,
        ...style,
      }}
    >
      {initials || "??"}
    </div>
  );
}
