export type PortalRole = "admin" | "teacher" | "student" | "parent";

export interface AuthUser {
    id: string;
    email: string;
    role: PortalRole;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
}

export interface LoginResponse {
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

function getConfiguredLoginPath() {
    const configuredPath = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH;

    if (!configuredPath) {
        return null;
    }

    return configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`;
}

function getLoginPaths() {
    const configuredPath = getConfiguredLoginPath();
    const paths = [configuredPath, "/auth/login", "/api/auth/login", "/api/v1/auth/login"].filter(
        (path): path is string => Boolean(path)
    );

    return Array.from(new Set(paths));
}

function getLoginErrorMessage(status: number, payload: ApiErrorPayload) {
    if (status === 400) {
        if (Array.isArray(payload.message)) {
            return payload.message.join(", ");
        }

        if (typeof payload.message === "string" && payload.message.length > 0) {
            return payload.message;
        }

        return "Please check your email format and required fields.";
    }

    if (status === 401) {
        return "Invalid email or password";
    }

    if (status >= 500) {
        return "Login service is temporarily unavailable. Please try again.";
    }

    return "Unable to sign in with the current server settings. Check NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_AUTH_LOGIN_PATH.";
}

export async function login(email: string, password: string, role: PortalRole): Promise<LoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedRole = role.toLowerCase() as PortalRole;
    const baseUrl = getApiBaseUrl();
    const loginPaths = getLoginPaths();
    let lastErrorMessage = "Unable to sign in right now. Please try again.";

    for (const path of loginPaths) {
        let response: Response;

        try {
            response = await fetch(`${baseUrl}${path}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: normalizedEmail,
                    password: normalizedPassword,
                    role: normalizedRole,
                }),
            });
        } catch {
            throw new Error("Cannot reach authentication server. Check NEXT_PUBLIC_API_BASE_URL and ensure backend is running.");
        }

        if (response.ok) {
            return (await response.json()) as LoginResponse;
        }

        let payload: ApiErrorPayload = {};

        try {
            payload = (await response.json()) as ApiErrorPayload;
        } catch {
            // Ignore response parsing failures and use status-based fallback.
        }

        lastErrorMessage = getLoginErrorMessage(response.status, payload);

        // Try the next path when the endpoint is missing.
        if (response.status === 404) {
            continue;
        }

        throw new Error(lastErrorMessage);
    }

    throw new Error(lastErrorMessage);
}

export function persistAuthSession(session: LoginResponse) {
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

export function clearAuthSession() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}
