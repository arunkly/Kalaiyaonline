import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

export type MailSettings = {
  fromEmail: string;
  fromName: string;
  hasKey: boolean;
};

export async function sendAppEmail(to: string, subject: string, html: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ fromEmail: string; fromName: string; resendKey: string }>`
    select from_email as "fromEmail", from_name as "fromName", resend_key as "resendKey"
    from mail_settings where id = 1 limit 1
  `;
  const cfg = rows[0];
  const key = process.env.RESEND_API_KEY || cfg?.resendKey || "";
  if (!key) {
    throw new Error("इमेल सेवा कन्फिगर छैन। डेस्कमा Resend API की राख्नुहोस्।");
  }
  const from = `${cfg?.fromName || "KalaiyaOnline"} <${cfg?.fromEmail || "noreply@kalaiyaonline.com"}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 180) || "इमेल पठाउन सकिएन।");
  }
}

export const getMailSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const session = await getSessionUser();
    if (!session || session.id !== context.userId || !isAdminEmail(session.email)) {
      throw new Error("Forbidden");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ fromEmail: string; fromName: string; resendKey: string }>`
      select from_email as "fromEmail", from_name as "fromName", resend_key as "resendKey"
      from mail_settings where id = 1 limit 1
    `;
    return {
      fromEmail: rows[0]?.fromEmail || "noreply@kalaiyaonline.com",
      fromName: rows[0]?.fromName || "KalaiyaOnline",
      hasKey: Boolean(rows[0]?.resendKey || process.env.RESEND_API_KEY),
    } satisfies MailSettings;
  });

export const saveMailSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      fromEmail: z.string().email(),
      fromName: z.string().min(2).max(80),
      resendKey: z.string().max(400).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const session = await getSessionUser();
    if (!session || session.id !== context.userId || !isAdminEmail(session.email)) {
      throw new Error("Forbidden");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.resendKey) {
      await sql`
        insert into mail_settings (id, from_email, from_name, resend_key)
        values (1, ${data.fromEmail}, ${data.fromName}, ${data.resendKey})
        on conflict (id) do update set
          from_email = excluded.from_email,
          from_name = excluded.from_name,
          resend_key = excluded.resend_key
      `;
    } else {
      await sql`
        insert into mail_settings (id, from_email, from_name)
        values (1, ${data.fromEmail}, ${data.fromName})
        on conflict (id) do update set
          from_email = excluded.from_email,
          from_name = excluded.from_name
      `;
    }
    return { ok: true };
  });
