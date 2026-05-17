"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KitSidebar } from "@/components/kit/sidebar-kit";
import { KitHeader } from "@/components/kit/header-kit";
import { ShellDataProvider } from "@/components/kit/ShellDataContext";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { clearAuth, getAccessToken, getStoredUser, refreshStoredProfile } from "@/lib/auth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import RealtimeToast from "@/components/RealtimeToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useCurrentUser("student");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (!isClient) return;
        if (pathname === "/student/login") { setIsAuthorized(true); return; }
        const token = getAccessToken();
        const stored = getStoredUser();
        if (!token || !stored || stored.role !== "student") {
            clearAuth();
            setIsAuthorized(false);
            router.replace("/student/login");
            return;
        }
        setIsAuthorized(true);
        void refreshStoredProfile();
    }, [pathname, router, isClient]);

    const { toast, setToast } = useRealtimeNotifications(user.id, user.fullName);

    // The active-exam route uses a full-screen lockdown surface — skip the shell.
    if (pathname.startsWith("/student/exam/")) {
        if (!isClient || !isAuthorized) return null;
        return <>{children}</>;
    }

    if (pathname === "/student/login") return <>{children}</>;
    if (!isClient || !isAuthorized) return null;

    return (
        <ShellDataProvider role="student">
            <div className="app" data-role="student">
                <KitSidebar role="student" />
                <main id="main-content" className="kit-shell-main role-student">
                    <KitHeader role="student" />
                    <ErrorBoundary>{children}</ErrorBoundary>
                </main>
                <RealtimeToast toast={toast} onClose={() => setToast(null)} />
            </div>
        </ShellDataProvider>
    );
}
