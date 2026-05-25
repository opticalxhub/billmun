import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the NXTMUN team. Send us a message or reach out via email at pr@portal.nxtmun.com.",
  openGraph: {
    title: "Contact | NXTMUN",
    description: "Get in touch with the NXTMUN team.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

