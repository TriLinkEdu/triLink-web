import Link from "next/link";

export default function NotFound() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
                background: "var(--gray-50, #f8fafc)",
            }}
        >
            <div
                style={{
                    maxWidth: 480,
                    width: "100%",
                    background: "#fff",
                    borderRadius: 16,
                    padding: "2rem",
                    boxShadow: "0 6px 24px rgba(15,23,42,0.06)",
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--primary-600, #2563eb)",
                    }}
                >
                    404
                </p>
                <h1
                    style={{
                        margin: "0.5rem 0 1rem",
                        fontSize: "1.5rem",
                        color: "var(--gray-900, #0f172a)",
                    }}
                >
                    Page not found
                </h1>
                <p style={{ margin: "0 0 1.5rem", color: "var(--gray-600, #475569)" }}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    style={{
                        display: "inline-block",
                        padding: "0.65rem 1.25rem",
                        borderRadius: 10,
                        border: "1px solid var(--primary-600, #2563eb)",
                        background: "var(--primary-600, #2563eb)",
                        color: "#fff",
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    Go home
                </Link>
            </div>
        </main>
    );
}
