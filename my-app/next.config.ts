/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Turbopack the project root is THIS folder.
  turbopack: { root: __dirname },

  // Make sure Prisma Client stays external (don’t bundle it away).
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};

export default nextConfig;