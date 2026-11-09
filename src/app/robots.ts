import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const canonicalSiteUrl = getCanonicalSiteUrl();
  if (!canonicalSiteUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", canonicalSiteUrl).toString(),
  };
}
