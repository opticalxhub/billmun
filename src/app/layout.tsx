import "./globals.css";
import type { Metadata } from "next";
import OnboardingManager from "@/components/onboarding/OnboardingManager";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "BILLMUN",
  description: "Advanced MUN Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="min-h-screen bg-bg-base text-text-primary font-inter text-rendering-optimizeLegibility">
        <Providers>
          {children}
          <OnboardingManager />
        </Providers>
      </body>
    </html>
  );
}
