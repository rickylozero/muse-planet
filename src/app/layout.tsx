import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getCanonicalSiteUrl } from "@/lib/site-url";
import "./globals.css";

const brandName = "沐智星球親子平台";
const brandEnglishName = "Muse Planet";
const brandFullName = `${brandName} (${brandEnglishName})`;
const siteDescription =
  "專為香港家長打造的智慧教育平台，整合最新教育局快訊、升學情報與天文台即時天氣，您的育兒專屬智囊團。";
const canonicalSiteUrl = getCanonicalSiteUrl();
const socialImageUrl = canonicalSiteUrl
  ? new URL("/social-card.svg", canonicalSiteUrl).toString()
  : undefined;

export const metadata: Metadata = {
  metadataBase: canonicalSiteUrl,
  title: {
    default: `${brandFullName} | 香港親子教育與升學資訊`,
    template: `%s | ${brandFullName}`,
  },
  description: siteDescription,
  applicationName: brandFullName,
  keywords: [
    "香港親子教育",
    "教育局快訊",
    "香港升學資訊",
    "親子學習技巧",
    "兒童健康",
    "香港天文台天氣",
  ],
  alternates: canonicalSiteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    locale: "zh_HK",
    siteName: brandFullName,
    title: `${brandFullName}｜香港親子教育與升學資訊`,
    description: siteDescription,
    ...(canonicalSiteUrl ? { url: "/" } : {}),
    ...(socialImageUrl
      ? {
          images: [
            {
              url: socialImageUrl,
              width: 1200,
              height: 630,
              alt: `${brandFullName} — 香港家長的智慧教育平台`,
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: socialImageUrl ? "summary_large_image" : "summary",
    title: `${brandFullName}｜香港親子教育與升學資訊`,
    description: siteDescription,
    ...(socialImageUrl ? { images: [socialImageUrl] } : {}),
  },
  icons: {
    icon: "/brand-mark.svg",
    apple: "/brand-mark.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F9F9",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant-HK" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
