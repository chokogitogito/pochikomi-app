import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/survey/golf-a",
        destination: "/survey/classic",
        permanent: false,
      },
      {
        source: "/survey/golf-b",
        destination: "/survey/ss-grand",
        permanent: false,
      },
      {
        source: "/admin/stores/golf-a",
        destination: "/admin/stores/classic",
        permanent: false,
      },
      {
        source: "/admin/stores/golf-b",
        destination: "/admin/stores/ss-grand",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
