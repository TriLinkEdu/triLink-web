/**
 * Central API base URL for TriLink NestJS backend.
 * All authenticated calls should use authFetch from ./auth.
 */
export function getApiBase(): string {
  const envBase =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")) || "";
  if (envBase) return envBase;
  // If no env is set, we default to the production backend
  return "https://trilink-backend-ms68.onrender.com";
}

/**
 * Robust helper to get a file download URL.
 * Handles cases where getApiBase might be empty or relative.
 */
export function getFileUrl(fileId: string | null | undefined): string {
  if (!fileId) return "";
  const base = getApiBase();
  // If base is empty (should not happen now with our default), fallback to the production backend
  const safeBase = base || "https://trilink-backend-ms68.onrender.com";
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
