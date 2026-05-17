"use client";
import LoginPage from "@/components/LoginPage";

export default function TeacherLogin() {
    return (
        <LoginPage
            role="Teacher"
            rolePlural="Teachers"
            dashboardPath="/teacher/dashboard"
            tagline="Empower your classroom"
        />
    );
}
