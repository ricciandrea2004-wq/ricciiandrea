/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/legale", destination: "/legale/privacy", permanent: false },
      { source: "/app/impostazioni", destination: "/app/impostazioni/profilo", permanent: false },
    ];
  },
};

export default nextConfig;
