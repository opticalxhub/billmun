import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Socials",
  description: "Follow BILLMUN on Instagram and stay updated with the latest news, photos, and announcements.",
  openGraph: {
    title: "Socials | BILLMUN",
    description: "Follow BILLMUN on Instagram and stay updated.",
  },
};

export default function SocialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
