import "./globals.css";
import type { Metadata, Viewport } from "next";
import OnboardingManager from "@/components/onboarding/OnboardingManager";
import { Providers } from "@/components/providers";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: {
    default: "BILLMUN 2026 | Advanced Model United Nations Platform",
    template: "%s | BILLMUN 2026"
  },
  description: "Join BILLMUN 2026 - The premier Model United Nations conference at Rowad Al Khaleej. Experience advanced diplomatic simulation, real-time debate, and cutting-edge MUN technology.",
  keywords: [
    "BILLMUN",
    "Model United Nations",
    "MUN 2026",
    "Rowad Al Khaleej",
    "Diplomatic Simulation",
    "UN Conference",
    "Student Debate",
    "International Relations",
    "MUN Platform",
    "Saudi Arabia MUN",
    "Khobar",
    "Eastern Province",
    "BILLMUN",
    "BILLMUN Portal",
    "BILLMUN 2026",
    "BILLMUN.SA",
    "BILLMUN INSTAGRAM",
    "BILLMUN TWITTER",
    "BILLMUN LINKEDIN"
  ],
  authors: [{ name: "BILLMUN Team" }],
  creator: "BILLMUN",
  publisher: "BILLMUN",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://billmun.sa"),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.ico', sizes: '16x16' }
    ],
    apple: [
      { url: '/billmun.png', sizes: '180x180' }
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://billmun.sa",
    title: "BILLMUN 2026 | Advanced Model United Nations Platform",
    description: "Join BILLMUN 2026 - The premier Model United Nations conference at Rowad Al Khaleej. Experience advanced diplomatic simulation.",
    siteName: "BILLMUN 2026",
    images: [
      {
        url: "/billmun.png",
        width: 1200,
        height: 630,
        alt: "BILLMUN 2026 Conference Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BILLMUN 2026 | Advanced Model United Nations Platform",
    description: "Join BILLMUN 2026 - The premier Model United Nations conference at Rowad Al Khaleej.",
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
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://cdn.billmun.sa" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://billmun.sa" />
        <link rel="dns-prefetch" href="https://qmmgugalvcgaxvgsfslp.supabase.co" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.ico" sizes="16x16" />
        <link rel="apple-touch-icon" href="/billmun.png" sizes="180x180" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary font-inter text-rendering-optimizeLegibility">
        <Providers>
          {children}
          <OnboardingManager />
        </Providers>
      </body>
    </html>
  );
}
