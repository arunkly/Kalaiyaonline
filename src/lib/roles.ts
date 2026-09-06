import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

export type AppRole = "member" | "editor" | "admin";

export type RegisteredUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
};

async function assertAdmin(userId: string) {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  if (!session || session.id !== userId || !isAdminEmail(session.email)) {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ role: string }>`
      select role from user_roles where user_id = ${userId} limit 1
    `;
    if (rows[0]?.role !== "admin") throw new Error("Forbidden");
  }
}

export const listRegisteredUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql<{ id: string; name: string | null; email: string | null }>`
      select id, name, email from "user" order by "createdAt" desc
    `;
    const roles = await sql<{ userId: string; role: string }>`
      select user_id as "userId", role from user_roles
    `;
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (roles.find((r) => r.userId === u.id)?.role as AppRole) || (isAdminEmail(u.email) ? "admin" : "member"),
    })) satisfies RegisteredUser[];
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1).max(80), role: z.enum(["member", "editor", "admin"]) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into user_roles (user_id, role, updated_at)
      values (${data.userId}, ${data.role}, now())
      on conflict (user_id) do update set role = excluded.role, updated_at = now()
    `;
    return { ok: true };
  });
