import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Socials",
  description: "Follow NXTMUN on Instagram and stay updated with the latest news, photos, and announcements.",
  openGraph: {
    title: "Socials | NXTMUN",
    description: "Follow NXTMUN on Instagram and stay updated.",
  },
};

export default function SocialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

