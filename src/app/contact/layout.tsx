import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the BILLMUN team. Send us a message or reach out via email at pr@billmun.com.",
  openGraph: {
    title: "Contact | BILLMUN",
    description: "Get in touch with the BILLMUN team.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
