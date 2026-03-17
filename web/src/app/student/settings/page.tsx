"use client";
import SettingsPage from "@/components/SettingsPage";

export default function StudentSettings() {
    const currentUser = {
        id: "STU-2024-001",
        name: "Ahmed Hassan",
        email: "ahmed.hassan@school.edu",
        role: "student",
    };

    return <SettingsPage user={currentUser} />;
}
