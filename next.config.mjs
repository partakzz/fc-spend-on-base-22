/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable React Compiler
  experimental: {
    reactCompiler: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
