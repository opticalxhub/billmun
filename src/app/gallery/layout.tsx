import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from BILLMUN conferences — captured by our Media Team. Browse highlights from committee sessions, ceremonies, and more.",
  openGraph: {
    title: "Gallery | BILLMUN",
    description: "Photos from BILLMUN conferences — captured by our Media Team.",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
