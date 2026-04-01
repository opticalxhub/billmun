import "./globals.css";
import type { Metadata, Viewport } from "next";
import OnboardingManager from "@/components/onboarding/OnboardingManager";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { PressReleasesBanner } from "@/components/press-releases-banner";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: {
    default: "BILLMUN",
    template: "%s | BILLMUN"
  },
  description: "BILLMUN is a student-led Model United Nations conference. Apply to join, explore committees, and be part of the diplomatic experience. 3–4 April 2026.",
  keywords: [
    "BILLMUN",
    "BILLMUN 2026",
    "BILLMUN conference",
    "BILLMUN MUN",
    "Model United Nations",
    "MUN Saudi Arabia",
    "MUN Khobar",
    "Rowad Al Khaleej MUN",
    "student diplomacy",
    "BILLMUN apply",
    "BILLMUN gallery",
    "BILLMUN socials",
    "BILLMUN contact"
  ],
  authors: [{ name: "BILLMUN" }],
  creator: "BILLMUN",
  publisher: "BILLMUN",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://billmun.sa"),
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
    url: "https://billmun.sa",
    title: "BILLMUN",
    description: "BILLMUN is a student-led Model United Nations conference. Apply to join, explore committees, and be part of the diplomatic experience. 3–4 April 2026.",
    siteName: "BILLMUN",
    images: [
      {
        url: "/billmun.png",
        width: 1200,
        height: 630,
        alt: "BILLMUN Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BILLMUN",
    description: "BILLMUN is a student-led Model United Nations conference. 3–4 April 2026.",
    images: ["/billmun.png"],
    creator: "@billmun"
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
    canonical: "https://billmun.sa",
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
              "name": "BILLMUN",
              "url": "https://billmun.sa",
              "logo": "https://billmun.sa/billmun.png",
              "description": "BILLMUN is a student-led Model United Nations conference.",
              "sameAs": [
                "https://www.instagram.com/billmun.sa"
              ],
              "event": {
                "@type": "Event",
                "name": "BILLMUN 2026",
                "startDate": "2026-04-03",
                "endDate": "2026-04-04",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": {
                  "@type": "Place",
                  "name": "Rowad Al Khaleej International Schools",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Khobar",
                    "addressCountry": "SA"
                  }
                },
                "organizer": {
                  "@type": "Organization",
                  "name": "BILLMUN"
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
              "name": "BILLMUN",
              "url": "https://billmun.sa",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://billmun.sa/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <link rel="preconnect" href="https://cdn.billmun.sa" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://billmun.sa" />
        <link rel="dns-prefetch" href="https://qmmgugalvcgaxvgsfslp.supabase.co" />
        <link rel="icon" href="/billmun.png" sizes="any" />
        <link rel="icon" href="/billmun.png" sizes="32x32" />
        <link rel="icon" href="/billmun.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/billmun.png" sizes="180x180" />
        <link rel="shortcut icon" href="/billmun.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary font-inter text-rendering-optimizeLegibility">
        <Providers>
          <PressReleasesBanner />
          {children}
          <OnboardingManager />
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
