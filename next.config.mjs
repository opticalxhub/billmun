/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse touches test fixtures if bundled; keep it as a Node external for API routes.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
