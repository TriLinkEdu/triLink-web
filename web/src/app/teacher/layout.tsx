"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KitSidebar } from "@/components/kit/sidebar-kit";
import { KitHeader } from "@/components/kit/header-kit";
import { ShellDataProvider } from "@/components/kit/ShellDataContext";
import { useNotificationStore } from "@/store/notificationStore";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { getAccessToken, getStoredUser, clearAuth, refreshStoredProfile } from "@/lib/auth";
import RealtimeToast from "@/components/RealtimeToast";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const user = useCurrentUser("teacher");
    useNotificationStore();

    const { toast, setToast } = useRealtimeNotifications(user.id, user.fullName);

    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (!isClient) return;
        if (pathname === "/teacher/login") { setIsAuthorized(true); return; }
        const token = getAccessToken();
        const userStored = getStoredUser();
        if (!token || !userStored || userStored.role !== "teacher") {
            clearAuth();
            setIsAuthorized(false);
            router.replace("/teacher/login");
            return;
        }
        setIsAuthorized(true);
        void refreshStoredProfile();
    }, [pathname, router, isClient]);

    if (!isClient) {
        return <div className="admin-shell-loading" />;
    }

    if (pathname === "/teacher/login") return <>{children}</>;
    if (!isAuthorized) return null;

    return (
        <ShellDataProvider role="teacher">
            <div className="app" data-role="teacher">
                <KitSidebar role="teacher" />
                <main id="main-content" className="kit-shell-main role-teacher">
                    <KitHeader role="teacher" />
                    <ErrorBoundary>{children}</ErrorBoundary>
                </main>
                <RealtimeToast toast={toast} onClose={() => setToast(null)} />
            </div>
        </ShellDataProvider>
    );
}
