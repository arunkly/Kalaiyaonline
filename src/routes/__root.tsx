import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import { ThemeProvider, ThemeVars } from "@/components/theme-provider";
import { siteOrigin } from "@/lib/site-url";
import { DEFAULT_SEO, getSeoSettings, organizationJsonLd, seoImage, type SeoSettings } from "@/lib/seo";
import { DEFAULT_THEME, fontHref, getThemeSettings, type ThemeSettings } from "@/lib/theme";
import appCss from "../styles.css?url";

type RootData = { seo: SeoSettings; theme: ThemeSettings };

function asRootData(loaderData: unknown): RootData {
  const raw = loaderData as Partial<RootData> | SeoSettings | null | undefined;
  if (raw && typeof raw === "object" && "seo" in raw) {
    return {
      seo: (raw as RootData).seo ?? DEFAULT_SEO,
      theme: (raw as RootData).theme ?? DEFAULT_THEME,
    };
  }
  return { seo: (raw as SeoSettings) ?? DEFAULT_SEO, theme: DEFAULT_THEME };
}

export const Route = createRootRoute({
  loader: async () => {
    const [seo, theme] = await Promise.all([
      getSeoSettings().catch(() => DEFAULT_SEO),
      getThemeSettings().catch(() => DEFAULT_THEME),
    ]);
    return { seo, theme } satisfies RootData;
  },
  head: ({ loaderData }) => {
    const { seo, theme } = asRootData(loaderData);
    const origin = seo.canonicalUrl || siteOrigin();
    const image = seoImage(seo, origin);
    const meta = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: seo.title },
      { name: "theme-color", content: theme.primary },
      { name: "description", content: seo.description },
      { name: "robots", content: seo.robots },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ne_NP" },
      { property: "og:site_name", content: seo.siteName },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:url", content: origin },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: seo.title },
      { name: "twitter:description", content: seo.description },
      { name: "twitter:image", content: image },
    ];
    if (seo.keywords) meta.push({ name: "keywords", content: seo.keywords });
    if (seo.googleVerify) meta.push({ name: "google-site-verification", content: seo.googleVerify });
    if (seo.twitter) meta.push({ name: "twitter:site", content: `@${seo.twitter}` });
    return {
      meta,
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
        { rel: "canonical", href: origin },
        { rel: "stylesheet", href: fontHref(theme.font) },
      ],
    };
  },
  component: RootDocument,
});

function RootDocument() {
  const { seo, theme } = asRootData(Route.useLoaderData());
  const jsonLd = JSON.stringify(organizationJsonLd(seo)).replace(/</g, "\\u003c");
  return (
    <html lang="ne" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeVars theme={theme} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </head>
      <body className="bg-paper text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <Shell>
              <Outlet />
            </Shell>
          </ThemeProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
