import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

export type AboutPage = {
  title: string;
  body: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  website: string;
  orgName: string;
  registrationNo: string;
  extraNote: string;
};

export const getAboutPage = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<AboutPage>`
    select title, body, phone, email, address, facebook, website,
           org_name as "orgName", registration_no as "registrationNo", extra_note as "extraNote"
    from about_page where id = 1 limit 1
  `;
  return (
    rows[0] ?? {
      title: "हाम्रोबारे",
      body: "",
      phone: "",
      email: "",
      address: "",
      facebook: "",
      website: "https://kalaiyaonline.com",
      orgName: "KalaiyaOnline",
      registrationNo: "",
      extraNote: "",
    }
  );
});

export const saveAboutPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      title: z.string().min(2).max(80),
      body: z.string().max(4000),
      phone: z.string().max(30).optional(),
      email: z.string().max(80).optional(),
      address: z.string().max(160).optional(),
      facebook: z.string().max(200).optional(),
      website: z.string().max(200).optional(),
      orgName: z.string().max(80).optional(),
      registrationNo: z.string().max(80).optional(),
      extraNote: z.string().max(400).optional(),
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
    await sql`
      insert into about_page (id, title, body, phone, email, address, facebook, website, org_name, registration_no, extra_note)
      values (
        1,
        ${data.title.trim()},
        ${data.body.trim()},
        ${data.phone?.trim() ?? ""},
        ${data.email?.trim() ?? ""},
        ${data.address?.trim() ?? ""},
        ${data.facebook?.trim() ?? ""},
        ${data.website?.trim() ?? ""},
        ${data.orgName?.trim() ?? "KalaiyaOnline"},
        ${data.registrationNo?.trim() ?? ""},
        ${data.extraNote?.trim() ?? ""}
      )
      on conflict (id) do update set
        title = excluded.title,
        body = excluded.body,
        phone = excluded.phone,
        email = excluded.email,
        address = excluded.address,
        facebook = excluded.facebook,
        website = excluded.website,
        org_name = excluded.org_name,
        registration_no = excluded.registration_no,
        extra_note = excluded.extra_note
    `;
    return { ok: true };
  });
