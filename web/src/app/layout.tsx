import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriLink Education - Smart School Management System",
  description: "Learn smarter, grow faster. A comprehensive school management platform for students, teachers, admins, and parents.",
  icons: {
    icon: "/trilink-logo.png",
    shortcut: "/trilink-logo.png",
    apple: "/trilink-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/trilink-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/trilink-logo.png" />
        <link rel="apple-touch-icon" href="/trilink-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
