import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { PressReleasesBanner } from "@/components/press-releases-banner";
import { safeMetadataBaseUrl } from "@/lib/safe-url";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: {
    default: "NXTMUN",
    template: "%s | NXTMUN"
  },
  description: "NXTMUN is a student-led Model United Nations conference. Apply to join, explore committees, and be part of the diplomatic experience. 3–4 April 2026.",
  keywords: [
    "NXTMUN",
    "NXTMUN 2026",
    "NXTMUN conference",
    "NXTMUN MUN",
    "Model United Nations",
    "MUN Saudi Arabia",
    "MUN Khobar",
    "Yarmook Elementary Private School Dhahran MUN",
    "student diplomacy",
    "NXTMUN apply",
    "NXTMUN gallery",
    "NXTMUN socials",
    "NXTMUN contact"
  ],
  authors: [{ name: "NXTMUN" }],
  creator: "NXTMUN",
  publisher: "NXTMUN",
  metadataBase: safeMetadataBaseUrl(),
  icons: {
    icon: [
      { url: '/nxtmun.png', sizes: 'any' },
      { url: '/nxtmun.png', sizes: '32x32' },
      { url: '/nxtmun.png', sizes: '16x16' }
    ],
    apple: [
      { url: '/nxtmun.png', sizes: '180x180' }
    ],
    shortcut: '/nxtmun.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nxtmun.com",
    title: "NXTMUN",
    description: "NXTMUN is a student-led Model United Nations conference. Apply to join, explore committees, and be part of the diplomatic experience. 3–4 April 2026.",
    siteName: "NXTMUN",
    images: [
      {
        url: "/nxtmun.png",
        width: 1200,
        height: 630,
        alt: "NXTMUN Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "NXTMUN",
    description: "NXTMUN is a student-led Model United Nations conference. 3–4 April 2026.",
    images: ["/nxtmun.png"],
    creator: "@nxtmun"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  alternates: {
    canonical: "https://nxtmun.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "NXTMUN",
              "url": "https://nxtmun.com",
              "logo": "https://nxtmun.com/nxtmun.png",
              "description": "NXTMUN is a student-led Model United Nations conference.",
              "sameAs": [
                "https://www.instagram.com/nxtmun.sa"
              ],
              "event": {
                "@type": "Event",
                "name": "NXTMUN 2026",
                "startDate": "2026-04-03",
                "endDate": "2026-04-04",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": {
                  "@type": "Place",
                  "name": "Yarmook Elementary Private School Dhahran",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Dhahran",
                    "addressCountry": "SA"
                  }
                },
                "organizer": {
                  "@type": "Organization",
                  "name": "NXTMUN"
                }
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "NXTMUN",
              "url": "https://nxtmun.sa",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://nxtmun.sa/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <link rel="preconnect" href="https://cdn.nxtmun.sa" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nxtmun.sa" />
        <link rel="dns-prefetch" href="https://qmmgugalvcgaxvgsfslp.supabase.co" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/nxtmun.png" sizes="any" />
        <link rel="icon" href="/nxtmun.png" sizes="32x32" />
        <link rel="icon" href="/nxtmun.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/nxtmun.png" sizes="180x180" />
        <link rel="shortcut icon" href="/nxtmun.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary font-inter text-rendering-optimizeLegibility">
        <Providers>
          <PressReleasesBanner />
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-jotia), serif',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
