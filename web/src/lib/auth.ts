export type PortalRole = "admin" | "teacher" | "student" | "parent";

export interface AuthUser {
    id: string;
    email: string;
    role: PortalRole;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
}

export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
}

interface ApiErrorPayload {
    message?: string | string[];
}

const ACCESS_TOKEN_KEY = "trilink.accessToken";
const REFRESH_TOKEN_KEY = "trilink.refreshToken";
const AUTH_USER_KEY = "trilink.user";

function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
}

function getEnvPath(name: "NEXT_PUBLIC_AUTH_LOGIN_PATH" | "NEXT_PUBLIC_AUTH_REFRESH_PATH", fallback: string) {
    const value = process.env[name];

    if (!value) {
        return fallback;
    }

    return value.startsWith("/") ? value : `/${value}`;
}

function getApiMessage(payload: ApiErrorPayload) {
    if (Array.isArray(payload.message)) {
        return payload.message.join(", ");
    }

    return typeof payload.message === "string" ? payload.message : "";
}

function getFriendlyAuthError(status: number, payload: ApiErrorPayload) {
    if (status === 400) {
        const apiMessage = getApiMessage(payload);
        return apiMessage || "Please check your email format and required fields.";
    }

    if (status === 401) {
        return "Invalid email or password";
    }

    if (status >= 500) {
        return "Login service is temporarily unavailable. Please try again.";
    }

    return "Unable to log in right now. Please try again.";
}

function getFriendlyRefreshError(status: number, payload: ApiErrorPayload) {
    if (status === 401) {
        return "Your session has expired. Please log in again.";
    }

    if (status >= 500) {
        return "Token refresh is temporarily unavailable. Please try again.";
    }

    const apiMessage = getApiMessage(payload);
    return apiMessage || "Unable to refresh session. Please log in again.";
}

async function parseErrorPayload(response: Response) {
    try {
        return (await response.json()) as ApiErrorPayload;
    } catch {
        return {};
    }
}

export async function login(email: string, password: string, role: PortalRole): Promise<AuthSession> {
    const response = await fetch(`${getApiBaseUrl()}${getEnvPath("NEXT_PUBLIC_AUTH_LOGIN_PATH", "/api/auth/login")}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            role: role.toLowerCase(),
        }),
    });

    if (!response.ok) {
        const payload = await parseErrorPayload(response);
        throw new Error(getFriendlyAuthError(response.status, payload));
    }

    return (await response.json()) as AuthSession;
}

export async function refreshTokens(refreshToken: string): Promise<AuthSession> {
    const response = await fetch(`${getApiBaseUrl()}${getEnvPath("NEXT_PUBLIC_AUTH_REFRESH_PATH", "/api/auth/refresh")}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        const payload = await parseErrorPayload(response);
        throw new Error(getFriendlyRefreshError(response.status, payload));
    }

    return (await response.json()) as AuthSession;
}

export function persistAuthSession(session: AuthSession) {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
}

export function getAccessToken() {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser() {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = localStorage.getItem(AUTH_USER_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export function getRefreshToken() {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function refreshAccessTokenFromStorage() {
    const token = getRefreshToken();

    if (!token) {
        throw new Error("No refresh token found. Please log in again.");
    }

    const session = await refreshTokens(token);
    persistAuthSession(session);
    return session;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const send = (token: string | null) => {
        const headers = new Headers(init.headers ?? {});

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return fetch(input, {
            ...init,
            headers,
        });
    };

    const currentAccessToken = getAccessToken();
    const firstResponse = await send(currentAccessToken);

    if (firstResponse.status !== 401) {
        return firstResponse;
    }

    const currentRefreshToken = getRefreshToken();

    if (!currentRefreshToken) {
        return firstResponse;
    }

    try {
        const refreshed = await refreshTokens(currentRefreshToken);
        persistAuthSession(refreshed);
        return send(refreshed.accessToken);
    } catch {
        clearAuthSession();
        throw new Error("Your session has expired. Please log in again.");
    }
}

export function clearAuthSession() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

export function logoutToRoleLogin(role: PortalRole) {
    clearAuthSession();

    if (typeof window === "undefined") {
        return;
    }

    window.location.href = `/${role}/login`;
}
