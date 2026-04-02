import type { MetadataRoute } from "next";

/** Served at /robots.txt (Next.js App Router). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/eb/dash", "/messages", "/documents"],
    },
  };
}
