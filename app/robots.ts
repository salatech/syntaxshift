import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://syntaxshifts.vercel.app/sitemap.xml",
    host: "https://syntaxshifts.vercel.app",
  };
}
