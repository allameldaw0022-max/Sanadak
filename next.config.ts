import type { NextConfig } from "next";

// Deliberately not adding a Content-Security-Policy here: getting one
// right for a Next.js app (inline hydration scripts, Tailwind, next/image,
// the Supabase/R2 origins this app talks to) needs real testing against
// every page before it ships, and a wrong CSP silently breaks the site
// rather than failing loudly. The headers below are the low-risk ones —
// they don't change how the app behaves, only how browsers are allowed to
// (mis)use it from the outside.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera=(self): the in-site QR scanner (Sprint 4) needs getUserMedia on
  // this origin's own pages -- still denied to any third-party/embedding
  // context, same as before. microphone/geolocation stay fully blocked;
  // nothing in the app uses either.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vypybcqihqpcaptjcoql.supabase.co",
        pathname: "/storage/v1/object/public/app-icons/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
