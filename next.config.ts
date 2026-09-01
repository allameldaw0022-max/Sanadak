import type { NextConfig } from "next";

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
};

export default nextConfig;
