/**
 * Central API base URL for TriLink NestJS backend.
 * All authenticated calls should use authFetch from ./auth.
 */
export function getApiBase(): string {
  const envBase =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")) || "";
  if (envBase) return envBase;
  if (typeof window !== "undefined") {
    // If we're in the browser and no env is set, we MUST fallback to port 4000 on the same host
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

/**
 * Robust helper to get a file download URL.
 * Handles cases where getApiBase might be empty or relative.
 */
export function getFileUrl(fileId: string | null | undefined): string {
  if (!fileId) return "";
  const base = getApiBase();
  // If base is empty, we force a fallback to localhost:4000 to avoid relative path failures in dev
  const safeBase = base || "http://localhost:4000";
  return `${safeBase}/api/files/${fileId}/download`;
}

/** Paths are relative to API host (include /api prefix). */
export const apiPath = {
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  me: "/api/auth/me",
  changePassword: "/api/auth/change-password",
  register: "/api/auth/register",
} as const;
