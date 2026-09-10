import { createFileRoute } from "@tanstack/react-router";
import { listPublishedStories } from "@/lib/desk";
import { readFeatureFlags } from "@/lib/features";
import { readSeoSettings } from "@/lib/seo";

const STATIC_PATHS: { path: string; feature?: "gallery" | "directory" | "blood" | "members" | "market" | "patro" | "privacy" | "about" }[] = [
  { path: "/" },
  { path: "/about", feature: "about" },
  { path: "/privacy", feature: "privacy" },
  { path: "/gallery", feature: "gallery" },
  { path: "/directory", feature: "directory" },
  { path: "/blood", feature: "blood" },
  { path: "/members", feature: "members" },
  { path: "/market", feature: "market" },
  { path: "/patro", feature: "patro" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [seo, stories, flags] = await Promise.all([
          readSeoSettings(),
          listPublishedStories().catch(() => []),
          readFeatureFlags().catch(() => null),
        ]);
        const host = seo.canonicalUrl.replace(/\/$/, "");
        const pages = STATIC_PATHS.filter((p) => !p.feature || !flags || flags[p.feature]);
        const urls = [
          ...pages.map((p) => ({ loc: `${host}${p.path === "/" ? "/" : p.path}`, changefreq: "daily", priority: p.path === "/" ? "1.0" : "0.7" })),
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
