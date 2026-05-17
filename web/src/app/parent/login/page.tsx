"use client";
import LoginPage from "@/components/LoginPage";

export default function ParentLogin() {
  return (
    <LoginPage
      role="Parent"
      rolePlural="Parents"
      dashboardPath="/parent/dashboard"
      tagline="Stay connected with your child's learning"
    />
  );
}
