"use client";
import SettingsPage from "@/components/SettingsPage";

export default function ParentSettings() {
    const currentUser = {
        id: "PAR-2024-001",
        name: "Fatima Mohammed",
        email: "fatima.mohammed@email.com",
        role: "parent",
    };

    return <SettingsPage user={currentUser} />;
}
