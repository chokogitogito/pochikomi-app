import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/survey/classic",
        destination: "/survey/golf-a",
        permanent: false,
      },
      {
        source: "/survey/ss-grand",
        destination: "/survey/golf-b",
        permanent: false,
      },
      {
        source: "/admin/stores/classic",
        destination: "/admin/stores/golf-a",
        permanent: false,
      },
      {
        source: "/admin/stores/ss-grand",
        destination: "/admin/stores/golf-b",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
