/** @type {import('next').NextConfig} */

const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

// CSP pensada para: YouTube IFrame API (embed oculto), Google Fonts, y nada más.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com${
  process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://i.ytimg.com https://*.ytimg.com;
  frame-src https://www.youtube.com;
  connect-src 'self' https://www.googleapis.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // CORS restringido solo al dominio propio para toda la API pública
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: APP_ORIGIN },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.ytimg.com" },
    ],
  },
};

module.exports = nextConfig;
