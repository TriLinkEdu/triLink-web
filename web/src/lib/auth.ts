/**
 * auth.ts — Token storage, automatic refresh, and authenticated fetch.
 *
 * Keys stored in localStorage:
 *   trilink.accessToken   — short-lived JWT
 *   trilink.refreshToken  — long-lived refresh token
 *   trilink.user          — JSON: { id, firstName, lastName, email, role, ... }
 */

const ACCESS_KEY = "trilink.accessToken";
const REFRESH_KEY = "trilink.refreshToken";
const USER_KEY = "trilink.user";

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("trilink-auth"));
  }
}

// ─── User profile helpers ─────────────────────────────────────────────────────

export interface StoredUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  // role-specific
  grade?: string;
  section?: string;
  subject?: string;
  department?: string;
  childName?: string;
  relationship?: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("trilink-auth"));
  }
}

/** Derive initials from a stored user */
export function getUserInitials(user: StoredUser | null): string {
  if (!user) return "??";
  return (
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")
  ).toUpperCase();
}

// ─── Token refresh ────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const apiBase =
        (typeof process !== "undefined" &&
          process.env?.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")) ||
        "http://localhost:4000";
      const refreshPath =
        (typeof process !== "undefined" &&
          process.env?.NEXT_PUBLIC_AUTH_REFRESH_PATH) ||
        "/api/auth/refresh";

      const res = await fetch(`${apiBase}${refreshPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuth();
        return null;
      }

      const data = await res.json();
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken as string;
      }
      clearAuth();
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Authenticated fetch with auto-refresh ────────────────────────────────────

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(input, { ...init, headers });

  // If 401, try to refresh and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(input, { ...init, headers });
    } else {
      // Refresh failed — redirect to appropriate login page
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const role = path.split("/").filter(Boolean)[0] ?? "admin";
        const loginPath = `/${role}/login`;
        if (!window.location.pathname.includes("/login")) {
          window.location.href = loginPath;
        }
      }
    }
  }

  return response;
}
