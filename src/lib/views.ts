import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const incrementView = createServerFn({ method: "POST" })
  .validator(
    z.object({
      kind: z.enum(["story", "gallery", "directory"]),
      key: z.string().min(1).max(160),
    }),
  )
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.kind === "story") {
      const rows = await sql<{ views: number }>`
        update desk_stories set views = views + 1
        where slug = ${data.key} and deleted_at is null
        returning views
      `;
      return { views: Number(rows[0]?.views ?? 0) };
    }
    if (data.kind === "gallery") {
      const rows = await sql<{ views: number }>`
        update gallery_posts set views = views + 1
        where slug = ${data.key}
        returning views
      `;
      return { views: Number(rows[0]?.views ?? 0) };
    }
    const id = Number(data.key);
    const rows = await sql<{ views: number }>`
      update dir_entries set views = views + 1
      where id = ${id}
      returning views
    `;
    return { views: Number(rows[0]?.views ?? 0) };
  });
