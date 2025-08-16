/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize images for production
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // Environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
  },
  
  // Disable telemetry
  telemetry: false,
  
  // Experimental features
  experimental: {
    // Remove the deprecated appDir option
  }
}

module.exports = nextConfig