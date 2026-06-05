import type { NextConfig } from "next";
import path from "path";

// Heavy native / wasm packages that are not used in demo mode. They are stubbed
// out (aliased to a no-op module) so the app compiles without them.
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

const stubPath = path.resolve(__dirname, "services/utils/noop-module.js");

const nextConfig: NextConfig = {
  devIndicators: false,

  // Turbopack (`next dev --turbopack`) — mirror the webpack aliases below so the
  // heavy native packages are stubbed out. Turbopack ignores the webpack() hook,
  // so these must be declared separately. Dramatically faster dev compilation.
  turbopack: {
    resolveAlias: Object.fromEntries(removedPackages.map(pkg => [pkg, "./services/utils/noop-module.js"])),
  },

  // Webpack — still used by `next build`.
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

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
