import { siteOrigin } from "@/lib/site-url";

async function proxyRemoteImage(src: string | undefined) {
  const origin = siteOrigin().replace(/^http:\/\//, "https://");
  const fallback = `${origin}/og.jpg`;
  const url = String(src || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.redirect(fallback, 302);
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "KalaiyaOnline-ShareBot/1.0",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return Response.redirect(fallback, 302);
    const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!type.startsWith("image/")) return Response.redirect(fallback, 302);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 80) return Response.redirect(fallback, 302);
    return new Response(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return Response.redirect(fallback, 302);
  }
}

export async function proxyArticleImage(slug: string) {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ imageUrl: string }>`
      select image_url as "imageUrl" from desk_stories
      where slug = ${slug} and published = true
      limit 1
    `;
    return proxyRemoteImage(rows[0]?.imageUrl);
  } catch {
    return proxyRemoteImage("");
  }
}

export async function proxyGalleryImage(slug: string) {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ cover: string; photo: string }>`
      select p.cover_url as cover, (
        select image_url from gallery_photos where post_id = p.id order by id asc limit 1
      ) as photo
      from gallery_posts p
      where p.slug = ${slug}
      limit 1
    `;
    return proxyRemoteImage(rows[0]?.cover || rows[0]?.photo);
  } catch {
    return proxyRemoteImage("");
  }
}

export async function proxyDirectoryImage(id: number) {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ imageUrl: string }>`
      select image_url as "imageUrl" from dir_entries where id = ${id} limit 1
    `;
    return proxyRemoteImage(rows[0]?.imageUrl);
  } catch {
    return proxyRemoteImage("");
  }
}
