'use client'

export default function imageLoader({ src, width, quality }) {
  // For local development, return the src as-is for public folder images
  if (process.env.NODE_ENV === 'development' || src.startsWith('/')) {
    return src
  }
  return `https://cdn.billmun.com/${src}?w=${width}&q=${quality || 75}&format=webp`
}
