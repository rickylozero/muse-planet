import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const canonicalSiteUrl = getCanonicalSiteUrl();
  if (!canonicalSiteUrl) return [];

  return [{ url: new URL("/", canonicalSiteUrl).toString() }];
}
