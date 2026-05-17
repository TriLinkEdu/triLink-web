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

export default function ParentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useCurrentUser("parent");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (!isClient) return;
        if (pathname === "/parent/login") { setIsAuthorized(true); return; }
        const token = getAccessToken();
        const stored = getStoredUser();
        if (!token || !stored || stored.role !== "parent") {
            clearAuth();
            setIsAuthorized(false);
            router.replace("/parent/login");
            return;
        }
        setIsAuthorized(true);
        void refreshStoredProfile();
    }, [pathname, router, isClient]);

    const { toast, setToast } = useRealtimeNotifications(user.id, user.fullName);

    if (pathname === "/parent/login") return <>{children}</>;
    if (!isClient || !isAuthorized) return null;

    return (
        <ShellDataProvider role="parent">
            <div className="app" data-role="parent">
                <KitSidebar role="parent" />
                <main id="main-content" className="kit-shell-main role-parent">
                    <KitHeader role="parent" />
                    <ErrorBoundary>{children}</ErrorBoundary>
                </main>
                <RealtimeToast toast={toast} onClose={() => setToast(null)} />
            </div>
        </ShellDataProvider>
    );
}
