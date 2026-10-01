import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connecto.com";

  return {
    rules: [
      {
        userAgent: [
          "*",
          "OAI-SearchBot",
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/settings",
          "/settings/*",
          "/api/*",
          "/messages",
          "/messages/*",
          "/notifications",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
