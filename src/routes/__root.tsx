import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { ChromeBoot } from "@/components/chrome-boot";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import { absoluteUrl, siteOrigin } from "@/lib/site-url";
import appCss from "../styles.css?url";

const APP_NAME = DEFAULT_SEO.siteName;
const APP_DESC = DEFAULT_SEO.description;

export const Route = createRootRoute({
  head: () => {
    const origin = siteOrigin();
    const image = absoluteUrl(DEFAULT_SEO.ogImage, origin);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: DEFAULT_SEO.title },
        { name: "theme-color", content: DEFAULT_THEME.primary },
        { name: "description", content: APP_DESC },
        { name: "robots", content: "index,follow" },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "ne_NP" },
        { property: "og:site_name", content: APP_NAME },
        { property: "og:title", content: DEFAULT_SEO.title },
        { property: "og:description", content: APP_DESC },
        { property: "og:url", content: origin },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: DEFAULT_SEO.title },
        { name: "twitter:description", content: APP_DESC },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
        { rel: "canonical", href: origin },
        { rel: "stylesheet", href: fontHref("mukta") },
      ],
    };
  },
  component: () => (
    <html lang="ne" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-paper text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <ChromeBoot>
            <Shell>
              <Outlet />
            </Shell>
          </ChromeBoot>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
