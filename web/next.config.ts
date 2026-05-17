import type { NextConfig } from "next";

/**
 * Production-ready security headers. The CSP allows:
 *  - Self for everything by default.
 *  - 'unsafe-inline' for styles (Next.js + Tailwind currently emits inline styles).
 *  - Connections to the backend API (NEXT_PUBLIC_API_BASE_URL) and websocket URL.
 *  - Images from Cloudinary and self.
 * Tighten further once we adopt nonce-based CSP in Plan E.
 */
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
const wsBase = (process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "").trim();

const connectSrc = ["'self'", apiBase, wsBase, "https://res.cloudinary.com", "https://avatars.githubusercontent.com"]
  .filter(Boolean)
  .map((s) => s.replace(/^http(s)?:\/\//, (m) => m));

const csp = [
  "default-src 'self'",
  `connect-src ${connectSrc.join(" ")} wss: ws:`,
  "img-src 'self' data: blob: https://res.cloudinary.com https://avatars.githubusercontent.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
