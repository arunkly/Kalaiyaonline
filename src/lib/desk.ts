import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

const storyInput = z.object({
  title: z.string().trim().min(2, "शीर्षक लेख्नुहोस्।").max(180),
  excerpt: z.string().max(2000).optional(),
  body: z.string().trim().min(8, "विवरण लेख्नुहोस्।").max(20000),
  category: z.string().min(1).max(40),
  location: z.string().max(80).optional(),
  tags: z.string().max(160).optional(),
  imageUrl: z.string().max(2000).optional(),
  gallery: z.array(z.string().max(2000)).max(12).optional(),
});

export type DeskStory = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  location: string;
  tags: string;
  imageUrl?: string;
  galleryUrls?: string;
  gallery?: string[];
  published: boolean;
  createdAt: string;
  deletedAt?: string | null;
};

export type DeskCategory = {
  id: number;
  slug: string;
  label: string;
};

function autoExcerpt(body: string, excerpt?: string) {
  const given = excerpt?.trim();
  if (given) return given.slice(0, 2000);
  return body.replace(/\s+/g, " ").trim().slice(0, 180);
}

function parseImageUrl(raw?: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function cleanImageUrl(raw?: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  const parsed = parseImageUrl(value);
  if (!parsed) throw new Error("तस्बिरको लिंक सही छैन।");
  return parsed;
}

function galleryJson(urls?: string[]) {
  return JSON.stringify((urls ?? []).map((url) => parseImageUrl(url)).filter(Boolean));
}

let deskEnsured: Promise<void> | null = null;

async function getDeskSql() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  if (!deskEnsured) {
    deskEnsured = (async () => {
      await sql`alter table desk_stories add column if not exists image_url text not null default ''`;
      await sql`alter table desk_stories add column if not exists gallery_urls text not null default '[]'`;
      await sql`alter table desk_stories add column if not exists deleted_at timestamptz`;
      await sql`alter table desk_stories add column if not exists updated_at timestamptz not null default now()`;
    })().catch((err) => {
      deskEnsured = null;
      throw err;
    });
  }
  await deskEnsured;
  return sql;
}

function slugify() {
  return `news-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyCat(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `cat-${Date.now().toString(36)}`;
}

async function assertAdmin(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ email: string }>`
    select email from "user" where id = ${userId} limit 1
  `;
  if (!isAdminEmail(rows[0]?.email)) {
    throw new Error("एडमिन खाताले मात्र समाचार राख्न सकिन्छ।");
  }
}

export const ensureAdminReady = createServerFn({ method: "POST" }).handler(
  async () => {
    const { ensureAdminAccount } = await import("@/lib/ensure-admin.server");
    return ensureAdminAccount();
  },
);

export const listPublishedStories = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getDeskSql();
    try {
      return await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, location, tags,
               image_url as "imageUrl", gallery_urls as "galleryUrls", published, created_at as "createdAt"
        from desk_stories
        where published = true and deleted_at is null
        order by created_at desc
      `;
    } catch {
      return sql<DeskStory>`
        select id, slug, title, excerpt, body, category, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt"
        from desk_stories
        where published = true
        order by created_at desc
      `;
    }
  },
);

export const getPublishedStory = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const sql = await getDeskSql();
    try {
      const rows = await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, location, tags,
               image_url as "imageUrl", gallery_urls as "galleryUrls", published, created_at as "createdAt"
        from desk_stories
        where slug = ${data.slug} and published = true and deleted_at is null
        limit 1
      `;
      return rows[0] ?? null;
    } catch {
      const rows = await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt"
        from desk_stories
        where slug = ${data.slug} and published = true
        limit 1
      `;
      return rows[0] ?? null;
    }
  });

export const listCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<DeskCategory>`
      select id, slug, label from desk_categories
      order by case when slug = 'headline' then 0 else 1 end, id asc
    `;
  },
);

export const listAdminStories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    return sql<DeskStory>`
      select id, slug, title, excerpt, body, category, location, tags,
             image_url as "imageUrl", gallery_urls as "galleryUrls", published, created_at as "createdAt"
      from desk_stories
      where deleted_at is null
      order by created_at desc
    `;
  });

export const listTrashStories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    return sql<DeskStory>`
      select id, slug, title, excerpt, body, category, location, tags,
             image_url as "imageUrl", gallery_urls as "galleryUrls", published, created_at as "createdAt",
             deleted_at as "deletedAt"
      from desk_stories
      where deleted_at is not null
      order by deleted_at desc
    `;
  });

async function insertStory(
  sql: Awaited<ReturnType<typeof getDeskSql>>,
  data: z.infer<typeof storyInput>,
  userId: string,
) {
  const tags = data.tags?.trim() ?? "";
  const imageUrl = cleanImageUrl(data.imageUrl);
  const excerpt = autoExcerpt(data.body, data.excerpt);
  const location = data.location?.trim() || "कलैया";
  const gallery = galleryJson(data.gallery);
  let lastError: unknown;
  for (let i = 0; i < 3; i += 1) {
    const slug = slugify();
    try {
      const rows = await sql<DeskStory>`
        insert into desk_stories
          (user_id, slug, title, excerpt, body, category, location, tags, image_url, gallery_urls, published)
        values
          (${userId}, ${slug}, ${data.title}, ${excerpt}, ${data.body},
           ${data.category}, ${location}, ${tags}, ${imageUrl}, ${gallery}, true)
        returning id, slug, title, excerpt, body, category, location, tags,
                  image_url as "imageUrl", gallery_urls as "galleryUrls", published, created_at as "createdAt"
      `;
      if (rows[0]) return rows[0];
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (!msg.includes("unique") && !msg.includes("duplicate")) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("समाचार सेभ भएन।");
}

export const createStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(storyInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    try {
      return await insertStory(sql, data, context.userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "समाचार सेभ भएन।";
      if (msg.includes("तस्बिर") || msg.includes("एडमिन")) throw err;
      throw new Error(`समाचार सेभ भएन। ${msg.slice(0, 120)}`);
    }
  });

export const updateStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(storyInput.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    const tags = data.tags?.trim() ?? "";
    const imageUrl = cleanImageUrl(data.imageUrl);
    const excerpt = autoExcerpt(data.body, data.excerpt);
    const location = data.location?.trim() || "कलैया";
    const gallery = galleryJson(data.gallery);
    const rows = await sql<DeskStory>`
      update desk_stories
      set title = ${data.title},
          excerpt = ${excerpt},
          body = ${data.body},
          category = ${data.category},
          location = ${location},
          tags = ${tags},
          image_url = ${imageUrl},
          gallery_urls = ${gallery},
          updated_at = now()
      where id = ${data.id} and deleted_at is null
      returning id, slug, title, excerpt, body, category, location, tags,
                image_url as "imageUrl", published, created_at as "createdAt"
    `;
    return rows[0] ?? null;
  });

export const trashStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    await sql`
      update desk_stories
      set deleted_at = now()
      where id = ${data.id} and deleted_at is null
    `;
    return { ok: true };
  });

export const restoreStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    await sql`
      update desk_stories
      set deleted_at = null
      where id = ${data.id} and deleted_at is not null
    `;
    return { ok: true };
  });

export const purgeStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    await sql`
      delete from desk_stories
      where id = ${data.id} and deleted_at is not null
    `;
    return { ok: true };
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ label: z.string().min(2).max(40) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    const slug = slugifyCat(data.label);
    const rows = await sql<DeskCategory>`
      insert into desk_categories (slug, label)
      values (${slug}, ${data.label})
      returning id, slug, label
    `;
    return rows[0];
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number(),
      label: z.string().min(2).max(40),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    const existing = await sql<DeskCategory>`
      select id, slug, label from desk_categories where id = ${data.id}
    `;
    const current = existing[0];
    if (!current) throw new Error("Category not found");
    const nextSlug = slugifyCat(data.label);
    await sql`
      update desk_categories
      set label = ${data.label}, slug = ${nextSlug}
      where id = ${data.id}
    `;
    if (nextSlug !== current.slug) {
      await sql`
        update desk_stories
        set category = ${nextSlug}
        where category = ${current.slug}
      `;
    }
    return { id: data.id, slug: nextSlug, label: data.label };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getDeskSql();
    const existing = await sql<DeskCategory>`
      select id, slug, label from desk_categories where id = ${data.id}
    `;
    const current = existing[0];
    if (!current) throw new Error("Category not found");
    const live = await sql<{ count: string }>`
      select count(*)::text as count
      from desk_stories
      where category = ${current.slug} and deleted_at is null
    `;
    if (Number(live[0]?.count ?? 0) > 0) {
      throw new Error("यो विभागमा समाचार छन्। पहिले सार्नुहोस् वा ट्र्यासमा पठाउनुहोस्।");
    }
    await sql`delete from desk_categories where id = ${data.id}`;
    return { ok: true };
  });

export { ADMIN_EMAIL };
