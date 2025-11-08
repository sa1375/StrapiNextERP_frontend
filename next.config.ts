import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1625",
        pathname: "/uploads/**",
      },
      // اگر تولیدی داری، دامین پروڈشکن Strapi را هم همین‌جا اضافه کن
      // { protocol: 'https', hostname: 'cdn.yourdomain.com', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
