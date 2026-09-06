import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

export type StoryComment = {
  id: number;
  author: string;
  body: string;
  userId: string;
  createdAt: string;
};

export type StoryEngagement = {
  likes: number;
  dislikes: number;
  myVote: number;
  comments: StoryComment[];
};

async function sessionUser() {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  return getSessionUser();
}

export const getStoryEngagement = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const session = await sessionUser();
    const up = await sql<{ n: string }>`
      select count(*)::text as n from desk_votes where slug = ${data.slug} and value = 1
    `;
    const down = await sql<{ n: string }>`
      select count(*)::text as n from desk_votes where slug = ${data.slug} and value = -1
    `;
    let myVote = 0;
    if (session?.id) {
      const mine = await sql<{ value: number }>`
        select value from desk_votes
        where slug = ${data.slug} and user_id = ${session.id}
        limit 1
      `;
      myVote = Number(mine[0]?.value ?? 0);
    }
    const comments = await sql<StoryComment>`
      select id, author, body, user_id as "userId", created_at as "createdAt"
      from desk_comments
      where slug = ${data.slug}
      order by created_at desc
    `;
    return {
      likes: Number(up[0]?.n ?? 0),
      dislikes: Number(down[0]?.n ?? 0),
      myVote,
      comments,
    } satisfies StoryEngagement;
  });

export const castStoryVote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: z.string().min(1).max(120), value: z.union([z.literal(1), z.literal(-1)]) }))
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const existing = await sql<{ value: number }>`
      select value from desk_votes
      where slug = ${data.slug} and user_id = ${context.userId}
      limit 1
    `;
    if (existing[0]?.value === data.value) {
      await sql`delete from desk_votes where slug = ${data.slug} and user_id = ${context.userId}`;
    } else if (existing[0]) {
      await sql`
        update desk_votes set value = ${data.value}
        where slug = ${data.slug} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into desk_votes (slug, user_id, value)
        values (${data.slug}, ${context.userId}, ${data.value})
      `;
    }
    return { ok: true };
  });

export const addStoryComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: z.string().min(1).max(120), body: z.string().min(2).max(800) }))
  .handler(async ({ data, context }) => {
    const session = await sessionUser();
    const author = session?.email?.split("@")[0] || "पाठक";
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<StoryComment>`
      insert into desk_comments (slug, user_id, author, body)
      values (${data.slug}, ${context.userId}, ${author}, ${data.body.trim()})
      returning id, author, body, user_id as "userId", created_at as "createdAt"
    `;
    return rows[0];
  });

export const deleteStoryComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    const session = await sessionUser();
    const admin = isAdminEmail(session?.email);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (admin) {
      await sql`delete from desk_comments where id = ${data.id}`;
    } else {
      await sql`delete from desk_comments where id = ${data.id} and user_id = ${context.userId}`;
    }
    return { ok: true };
  });
