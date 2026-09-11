import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAppAdmin } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export const AD_SLOTS = [
  { id: "header", label: "हेडर" },
  { id: "home-top", label: "गृह माथि" },
  { id: "home-sidebar", label: "गृह साइडबार" },
  { id: "article-top", label: "समाचार माथि" },
  { id: "article-bottom", label: "समाचार तल" },
  { id: "gallery", label: "ग्यालरी" },
  { id: "directory", label: "डाइरेक्ट्री" },
  { id: "blood", label: "रक्तदाता" },
  { id: "footer", label: "फुटर" },
] as const;

export type AdKind = "photo" | "text" | "html";
export type AdItem = {
  id: number;
  slot: string;
  kind: AdKind;
  title: string;
  body: string;
  imageUrl: string;
  html: string;
  href: string;
  active: boolean;
};

async function assertAdmin(userId: string) {
  await assertAppAdmin(userId);
}

export const listAds = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql<AdItem>`
    select id, slot, kind, title, body,
           image_url as "imageUrl", html, href, active
    from ads
    order by id desc
  `;
});

export const listAdsBySlot = createServerFn({ method: "GET" })
  .validator(z.object({ slot: z.string().min(2).max(40) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<AdItem>`
      select id, slot, kind, title, body,
             image_url as "imageUrl", html, href, active
      from ads
      where slot = ${data.slot} and active = true
      order by id desc
    `;
  });

const adInput = z.object({
  slot: z.string().min(2).max(40),
  kind: z.enum(["photo", "text", "html"]),
  title: z.string().max(120).optional(),
  body: z.string().max(400).optional(),
  imageUrl: z.string().max(500).optional(),
  html: z.string().max(4000).optional(),
  href: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export const createAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(adInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into ads (slot, kind, title, body, image_url, html, href, active)
      values (
        ${data.slot},
        ${data.kind},
        ${data.title?.trim() ?? ""},
        ${data.body?.trim() ?? ""},
        ${data.imageUrl?.trim() ?? ""},
        ${data.html?.trim() ?? ""},
        ${data.href?.trim() ?? ""},
        ${data.active ?? true}
      )
    `;
    return { ok: true };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from ads where id = ${data.id}`;
    return { ok: true };
  });
