import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordClient } from "./reset-password-client";

export const metadata = {
    title: "Reset Password – TriLink",
};

export default function ResetPasswordPage() {
    return (
        <main className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-6 py-12">
            <Suspense fallback={null}>
                <ResetPasswordClient />
            </Suspense>
            <noscript>
                <p>
                    Enable JavaScript or{" "}
                    <Link href="/" className="underline">
                        return home
                    </Link>
                    .
                </p>
            </noscript>
        </main>
    );
}
