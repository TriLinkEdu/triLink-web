"use client";
import LoginPage from "@/components/LoginPage";

export default function ParentLogin() {
  return (
    <LoginPage
      role="Parent"
      rolePlural="Parents"
      dashboardPath="/parent/dashboard"
      gradient="linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4c1d95 100%)"
      tagline="Stay connected with your child's learning"
    />
  );
}
