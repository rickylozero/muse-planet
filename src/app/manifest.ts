import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "沐智星球親子平台 (Muse Planet)",
    short_name: "沐智星球",
    description:
      "專為香港家長打造的智慧教育平台，整合最新教育局快訊、升學情報與天文台即時天氣，您的育兒專屬智囊團。",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F9F9",
    theme_color: "#2D5A27",
    lang: "zh-Hant-HK",
    icons: [
      {
        src: "/brand-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
