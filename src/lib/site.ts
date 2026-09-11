import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAppAdmin } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type SiteIdentity = {
  name: string;
  nameNp: string;
  tagline: string;
  description: string;
  searchHint: string;
};

export const DEFAULT_SITE: SiteIdentity = {
  name: "KalaiyaOnline",
  nameNp: "कलैयाअनलाइन",
  tagline: "कलैया, बारा र मधेशको स्थानीय समाचार",
  description:
    "कलैयाअनलाइन — कलैया, बारा, पर्सा र मधेशका स्थानीय समाचार, ग्यालरी, डाइरेक्ट्री, रक्तदाता र सेयर बजार।",
  searchHint: "समाचार खोज्नुहोस्",
};

function text(value: unknown, fallback: string) {
  const v = value == null ? "" : String(value).trim();
  return v || fallback;
}

function normalize(row: Partial<SiteIdentity> | null | undefined): SiteIdentity {
  return {
    name: text(row?.name, DEFAULT_SITE.name),
    nameNp: text(row?.nameNp, DEFAULT_SITE.nameNp),
    tagline: text(row?.tagline, DEFAULT_SITE.tagline),
    description: text(row?.description, DEFAULT_SITE.description),
    searchHint: text(row?.searchHint, DEFAULT_SITE.searchHint),
  };
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists site_identity (
      id integer primary key,
      name text not null default 'KalaiyaOnline',
      name_np text not null default 'कलैयाअनलाइन',
      tagline text not null default '',
      description text not null default '',
      search_hint text not null default ''
    )
  `;
  return sql;
}

export async function readSiteIdentity(): Promise<SiteIdentity> {
  try {
    const sql = await ensureTable();
    const rows = await sql<Partial<SiteIdentity>>`
      select name, name_np as "nameNp", tagline, description, search_hint as "searchHint"
      from site_identity where id = 1 limit 1
    `;
    return normalize(rows[0]);
  } catch {
    return DEFAULT_SITE;
  }
}

export const getSiteIdentity = createServerFn({ method: "GET" }).handler(async () => readSiteIdentity());

export const saveSiteIdentity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(2).max(80),
      nameNp: z.string().min(2).max(80),
      tagline: z.string().max(160).optional(),
      description: z.string().max(400).optional(),
      searchHint: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAppAdmin(context.userId);
    const next = normalize(data);
    const sql = await ensureTable();
    await sql`
      insert into site_identity (id, name, name_np, tagline, description, search_hint)
      values (1, ${next.name}, ${next.nameNp}, ${next.tagline}, ${next.description}, ${next.searchHint})
      on conflict (id) do update set
        name = excluded.name,
        name_np = excluded.name_np,
        tagline = excluded.tagline,
        description = excluded.description,
        search_hint = excluded.search_hint
    `;
    try {
      await sql`
        update seo_settings set site_name = ${next.name} where id = 1
      `;
    } catch {
      /* seo table may be empty */
    }
    try {
      await sql`
        update about_page set org_name = ${next.name} where id = 1
      `;
    } catch {
      /* about table may be empty */
    }
    return next;
  });
