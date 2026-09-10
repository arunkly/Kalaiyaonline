import { createFileRoute } from "@tanstack/react-router";
import { readSeoSettings } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const seo = await readSeoSettings();
        const host = seo.canonicalUrl.replace(/\/$/, "");
        const body = [
          "User-agent: *",
          seo.robots.includes("noindex") ? "Disallow: /" : "Allow: /",
          "Disallow: /admin",
          "Disallow: /api/",
          "Disallow: /login",
          "Disallow: /account",
          `Sitemap: ${host}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
