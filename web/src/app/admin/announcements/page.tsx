"use client";

/**
 * Admin · Announcements — uses the shared 1:1 kit port.
 * The actual JSX lives in `@/components/kit/announcements-kit.tsx`.
 */
import { AnnouncementsKitPage } from "@/components/kit";

export default function AdminAnnouncementsPage() {
    return <AnnouncementsKitPage role="admin" />;
}
