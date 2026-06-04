/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Prisma's engine out of the bundler so the query engine resolves at runtime.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
