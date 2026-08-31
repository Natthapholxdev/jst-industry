import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* เพิ่ม Security Headers ป้องกันโจมตีระดับ Browser */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // ป้องกัน Clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // ป้องกัน MIME Sniffing (สำคัญเรื่อง File Upload)
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
