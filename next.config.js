const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.bo3.no'], // Allow images from Good Game Ligaen
  },
}

module.exports = withBundleAnalyzer(nextConfig)
