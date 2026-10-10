/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Basic protections on every page: no framing (clickjacking on the login), no MIME sniffing,
  // no full URLs (with tokens) sent to other sites, HTTPS only.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/legale", destination: "/legale/privacy", permanent: false },
      { source: "/app/impostazioni", destination: "/app/impostazioni/profilo", permanent: false },
    ];
  },
};

export default nextConfig;
