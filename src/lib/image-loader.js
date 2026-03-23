'use client'

export default function imageLoader({ src, width, quality }) {
  // Always append width param so Next.js Image component is satisfied
  const q = quality || 75
  if (src.startsWith('/')) {
    return `${src}?w=${width}&q=${q}`
  }
  const host = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  return `${host}${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${q}&format=webp`
}
