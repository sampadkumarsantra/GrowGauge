/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@react-pdf/renderer',
      '@prisma/client',
      'prisma',
    ],
  },
};

export default nextConfig;
