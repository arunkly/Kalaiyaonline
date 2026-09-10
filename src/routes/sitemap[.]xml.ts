import { createFileRoute } from "@tanstack/react-router";
import { listPublishedStories } from "@/lib/desk";
import { getSeoSettings } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/about",
  "/privacy",
  "/gallery",
  "/directory",
  "/blood",
  "/members",
  "/market",
  "/patro",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [seo, stories] = await Promise.all([getSeoSettings(), listPublishedStories().catch(() => [])]);
        const host = seo.canonicalUrl.replace(/\/$/, "");
        const urls = [
          ...STATIC_PATHS.map((path) => ({ loc: `${host}${path === "/" ? "/" : path}`, changefreq: "daily", priority: path === "/" ? "1.0" : "0.7" })),
          ...stories.map((s) => ({
            loc: `${host}/article/${s.slug}`,
            changefreq: "hourly",
            priority: "0.9",
          })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
