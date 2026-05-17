"use client";
import LoginPage from "@/components/LoginPage";

export default function AdminLogin() {
    return (
        <LoginPage
            role="Admin"
            rolePlural="Administrators"
            dashboardPath="/admin/dashboard"
            tagline="Manage with confidence"
        />
    );
}
