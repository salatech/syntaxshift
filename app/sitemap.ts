import type { MetadataRoute } from "next";

import { converterRegistry } from "@/lib/converters/registry";

const baseUrl = "https://syntaxshifts.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const converterUrls: MetadataRoute.Sitemap = converterRegistry.map((converter) => ({
    url: `${baseUrl}/${converter.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...converterUrls,
  ];
}
