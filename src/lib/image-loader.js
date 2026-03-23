'use client'

export default function imageLoader({ src, width, quality }) {
  // For local development, return the src as-is for public folder images
  if (process.env.NODE_ENV === 'development' || src.startsWith('/')) {
    return src
  }
  const host = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  return `${host}${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${quality || 75}&format=webp`
}
