import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

const storyInput = z.object({
  title: z.string().min(4).max(180),
  excerpt: z.string().min(8).max(400),
  body: z.string().min(20).max(8000),
  category: z.string().min(2).max(40),
  location: z.string().min(2).max(80),
  tags: z.string().max(160).optional(),
  imageUrl: z.string().max(500).optional(),
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
  published: boolean;
  createdAt: string;
  deletedAt?: string | null;
};

export type DeskCategory = {
  id: number;
  slug: string;
  label: string;
};

function cleanImageUrl(raw?: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("तस्बिरको लिंक सही छैन।");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("तस्बिर https वा http लिंक हुनुपर्छ।");
  }
  return parsed.toString();
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${base || "story"}-${Date.now().toString(36)}`;
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
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  if (!session || session.id !== userId || !isAdminEmail(session.email)) {
    throw new Error("Forbidden");
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
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<DeskStory>`
      select id, slug, title, excerpt, body, category, location, tags,
             image_url as "imageUrl", published, created_at as "createdAt"
      from desk_stories
      where published = true and deleted_at is null
      order by created_at desc
    `;
  },
);

export const getPublishedStory = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<DeskStory>`
      select id, slug, title, excerpt, body, category, location, tags,
             image_url as "imageUrl", published, created_at as "createdAt"
      from desk_stories
      where slug = ${data.slug} and published = true and deleted_at is null
      limit 1
    `;
    return rows[0] ?? null;
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
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<DeskStory>`
      select id, slug, title, excerpt, body, category, location, tags,
             image_url as "imageUrl", published, created_at as "createdAt"
      from desk_stories
      where user_id = ${context.userId} and deleted_at is null
      order by created_at desc
    `;
  });

export const listTrashStories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<DeskStory>`
      select id, slug, title, excerpt, body, category, location, tags,
             image_url as "imageUrl", published, created_at as "createdAt",
             deleted_at as "deletedAt"
      from desk_stories
      where user_id = ${context.userId} and deleted_at is not null
      order by deleted_at desc
    `;
  });

export const createStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(storyInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const slug = slugify(data.title);
    const tags = data.tags?.trim() ?? "";
    const imageUrl = cleanImageUrl(data.imageUrl);
    const rows = await sql<DeskStory>`
      insert into desk_stories
        (user_id, slug, title, excerpt, body, category, location, tags, image_url, published)
      values
        (${context.userId}, ${slug}, ${data.title}, ${data.excerpt}, ${data.body},
         ${data.category}, ${data.location}, ${tags}, ${imageUrl}, true)
      returning id, slug, title, excerpt, body, category, location, tags,
                image_url as "imageUrl", published, created_at as "createdAt"
    `;
    return rows[0];
  });

export const updateStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(storyInput.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const tags = data.tags?.trim() ?? "";
    const imageUrl = cleanImageUrl(data.imageUrl);
    const rows = await sql<DeskStory>`
      update desk_stories
      set title = ${data.title},
          excerpt = ${data.excerpt},
          body = ${data.body},
          category = ${data.category},
          location = ${data.location},
          tags = ${tags},
          image_url = ${imageUrl},
          updated_at = now()
      where id = ${data.id} and user_id = ${context.userId} and deleted_at is null
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
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update desk_stories
      set deleted_at = now()
      where id = ${data.id} and user_id = ${context.userId} and deleted_at is null
    `;
    return { ok: true };
  });

export const restoreStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update desk_stories
      set deleted_at = null
      where id = ${data.id} and user_id = ${context.userId} and deleted_at is not null
    `;
    return { ok: true };
  });

export const purgeStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      delete from desk_stories
      where id = ${data.id} and user_id = ${context.userId} and deleted_at is not null
    `;
    return { ok: true };
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ label: z.string().min(2).max(40) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
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
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
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
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
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
