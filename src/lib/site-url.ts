export function siteOrigin() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.APP_URL ||
    "https://www.kalaiyaonline.com"
  ).replace(/\/$/, "");
}

export function absoluteUrl(pathOrUrl: string | undefined, origin = siteOrigin()) {
  const value = pathOrUrl?.trim() ?? "";
  if (!value) return `${origin}/og.jpg`;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/og.jpg`;
}
