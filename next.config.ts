import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@react-pdf/renderer', '@react-pdf/layout', '@react-pdf/pdfkit', '@react-pdf/primitives'],
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
