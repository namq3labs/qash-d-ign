import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    const stubPath = path.resolve(__dirname, "services/utils/noop-module.js");
    const removedPackages = [
      "@miden-sdk/miden-sdk",
      "@miden-sdk/miden-para",
      "@miden-sdk/use-miden-para-react",
      "@miden-sdk/miden-wallet-adapter",
      "@openzeppelin/miden-multisig-client",
      "@openzeppelin/psm-client",
      "@getpara/react-sdk-lite",
      "@getpara/web-sdk",
      "@getpara/react-sdk",
    ];

    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    for (const pkg of removedPackages) {
      (config.resolve.alias as Record<string, string>)[pkg] = stubPath;
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
