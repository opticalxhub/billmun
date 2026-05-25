import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { PressReleasesBanner } from "@/components/press-releases-banner";
import { safeMetadataBaseUrl } from "@/lib/safe-url";

import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { validateEnv } from "@/lib/env";

validateEnv();

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
      { url: '/billmun.png', sizes: 'any' },
      { url: '/billmun.png', sizes: '32x32' },
      { url: '/billmun.png', sizes: '16x16' }
    ],
    apple: [
      { url: '/billmun.png', sizes: '180x180' }
    ],
    shortcut: '/billmun.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portal.nxtmun.com",
    title: "NXTMUN",
    description: "NXTMUN is a student-led Model United Nations conference. Apply to join, explore committees, and be part of the diplomatic experience. 3–4 April 2026.",
    siteName: "NXTMUN",
    images: [
      {
        url: "/billmun.png",
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
    images: ["/billmun.png"],
    creator: "@NXTMUN"
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
    canonical: "https://portal.nxtmun.com",
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
              "url": "https://portal.nxtmun.com",
              "logo": "https://portal.nxtmun.com/NXTMUN.png",
              "description": "NXTMUN is a student-led Model United Nations conference.",
              "sameAs": [
                "https://www.instagram.com/portal.nxtmun.com"
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
              "url": "https://portal.nxtmun.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://portal.nxtmun.com/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <link rel="preconnect" href="https://cdn.portal.nxtmun.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://portal.nxtmun.com" />
        <link rel="dns-prefetch" href="https://qmmgugalvcgaxvgsfslp.supabase.co" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/NXTMUN.png" sizes="any" />
        <link rel="icon" href="/NXTMUN.png" sizes="32x32" />
        <link rel="icon" href="/NXTMUN.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/NXTMUN.png" sizes="180x180" />
        <link rel="shortcut icon" href="/NXTMUN.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary font-inter text-rendering-optimizeLegibility">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-crimson focus:text-white focus:rounded-md focus:font-bold">
          Skip to main content
        </a>
        <Providers>
          <GlobalErrorBoundary>
            <ServiceWorkerRegistration />
            <PressReleasesBanner />
            <main id="main-content">
              {children}
            </main>
          </GlobalErrorBoundary>
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

