import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CommandPaletteProvider } from "@/components/providers/CommandPaletteProvider";
import { Toaster } from "@/components/shadcn/toaster";

/**
 * Inter — single workhorse UI typeface. Four weights only (kit spec).
 * Stylistic sets are enabled globally in `globals.css`
 * (`cv11 ss03 ss01 tnum 0`).
 */
const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
    variable: "--font-inter",
});

/**
 * Instrument Serif — reserved for italic display moments only
 * (the iris-tinted "TriLink." word on the portal welcome, and the
 * occasional emphatic word on a hero). One weight, italic.
 */
const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    display: "swap",
    weight: ["400"],
    style: ["italic", "normal"],
    variable: "--font-instrument-serif",
});

/**
 * JetBrains Mono — used in tabular contexts where digits would otherwise
 * jitter (the proctor activity feed, exam timers, ID columns, kbd hints).
 */
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500"],
    variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3000",
    ),
    title: {
        default: "TriLink",
        template: "%s · TriLink",
    },
    description:
        "School operations, simplified for every role — admins, teachers, students, and parents on one calm, dependable surface.",
    applicationName: "TriLink",
    referrer: "strict-origin-when-cross-origin",
    keywords: ["school", "education", "lms", "attendance", "grades", "operations"],
    icons: {
        icon: [
            { url: "/trilink-logo.svg", type: "image/svg+xml" },
            { url: "/favicon.ico", sizes: "any" },
        ],
        apple: [{ url: "/trilink-logo.svg" }],
    },
    openGraph: {
        type: "website",
        siteName: "TriLink",
        title: "TriLink — School operations, simplified",
        description:
            "One dependable surface for admins, teachers, students, and parents.",
        images: [
            {
                url: "/trilink-logo.svg",
                width: 512,
                height: 512,
                alt: "TriLink",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "TriLink — School operations, simplified",
        description:
            "One dependable surface for admins, teachers, students, and parents.",
        images: ["/trilink-logo.svg"],
    },
    robots: {
        index: false,
        follow: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
            suppressHydrationWarning
        >
            <body suppressHydrationWarning>
                <a className="skip-link" href="#main-content">
                    Skip to main content
                </a>
                <ThemeProvider>
                    <QueryProvider>
                        <CommandPaletteProvider>
                            {children}
                            <Toaster />
                        </CommandPaletteProvider>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
