/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker slim image (multi-stage build)
  output: 'standalone',
};

export default nextConfig;
