import { createServerFn } from "@tanstack/react-start";
import { isAdminEmail } from "@/lib/admin";

export async function hasAdminAccess(userId: string) {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  if (!session || session.id !== userId) return false;
  if (isAdminEmail(session.email)) return true;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ role: string }>`
      select role from user_roles where user_id = ${userId} limit 1
    `;
    return rows[0]?.role === "admin";
  } catch {
    return false;
  }
}

export async function assertAppAdmin(userId: string) {
  if (!(await hasAdminAccess(userId))) {
    throw new Error("एडमिन खाताले मात्र यो काम गर्न सक्छ।");
  }
}

export const getMyAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  if (!session?.id) return { admin: false };
  return { admin: await hasAdminAccess(session.id) };
});
