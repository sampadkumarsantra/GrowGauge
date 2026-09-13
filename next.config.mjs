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
      'next-auth',
      'jose',
      '@prisma/client',
      'prisma',
      'bcryptjs',
      'nodemailer',
    ],
  },
};

export default nextConfig;
