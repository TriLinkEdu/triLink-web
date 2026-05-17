"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KitSidebar } from "@/components/kit/sidebar-kit";
import { KitHeader } from "@/components/kit/header-kit";
import { ShellDataProvider } from "@/components/kit/ShellDataContext";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    useCurrentUser("admin");
    const isLoginRoute = pathname === "/admin/login";
    const token = getAccessToken();
    const stored = getStoredUser();
    const isAuthorized = isLoginRoute || (!!token && !!stored && stored.role === "admin");

    useEffect(() => {
        if (isClient && !isLoginRoute && !isAuthorized) {
            clearAuth();
            router.replace("/admin/login");
        }
    }, [isAuthorized, isLoginRoute, router, isClient]);

    if (isLoginRoute) return <>{children}</>;
    if (!isClient || !isAuthorized) return <div className="admin-shell-loading" />;

    return (
        <ShellDataProvider role="admin">
            <div className="app" data-role="admin">
                <KitSidebar role="admin" />
                <main id="main-content" className="kit-shell-main role-admin">
                    <KitHeader role="admin" />
                    <ErrorBoundary>{children}</ErrorBoundary>
                </main>
            </div>
        </ShellDataProvider>
    );
}
