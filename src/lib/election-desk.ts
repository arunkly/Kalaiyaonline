import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAppAdmin } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";
import { election, type ElectionData, type Party } from "@/lib/election";

const RESULTS_URL =
  "https://election.onlinekhabar.com/wp-json/okelapi/v1/2082/home/election-results?limit=40";

type FeedParty = {
  party_id?: number | string;
  party_name?: string;
  party_nickname?: string;
  party_slug?: string;
  party_color?: string;
  leading_count?: number | string;
  winner_count?: number | string;
  samanupatik?: number | string;
  samanupatik_seat?: number | string;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists election_desk (
      id text primary key,
      payload text not null,
      updated_at timestamptz default now()
    )
  `;
  return sql;
}

export async function readElectionDesk(): Promise<ElectionData> {
  try {
    const sql = await ensureTable();
    const rows = await sql<{ payload: string }>`select payload from election_desk where id = ${"main"}`;
    if (!rows[0]?.payload) {
      const payload = JSON.stringify(election);
      await sql`
        insert into election_desk (id, payload) values (${"main"}, ${payload})
        on conflict (id) do nothing
      `;
      return structuredClone(election);
    }
    return JSON.parse(rows[0].payload) as ElectionData;
  } catch {
    return structuredClone(election);
  }
}

async function writeElectionDesk(data: ElectionData) {
  const sql = await ensureTable();
  const payload = JSON.stringify(data);
  await sql`
    insert into election_desk (id, payload, updated_at)
    values (${"main"}, ${payload}, now())
    on conflict (id) do update set payload = excluded.payload, updated_at = now()
  `;
}

function mergeParties(current: Party[], incoming: FeedParty[]): Party[] {
  const bySlug = new Map(current.map((p) => [p.slug, { ...p }]));
  for (const row of incoming) {
    const slug = String(row.party_slug || "").trim();
    if (!slug) continue;
    const won = num(row.winner_count);
    const leading = num(row.leading_count);
    const prev = bySlug.get(slug);
    if (prev) {
      prev.won = won;
      prev.leading = leading;
      prev.seats = won;
      prev.proportionalVotes = num(row.samanupatik) || prev.proportionalVotes;
      prev.proportionalSeats = num(row.samanupatik_seat) || prev.proportionalSeats;
      if (row.party_nickname) prev.nick = String(row.party_nickname);
      if (row.party_name) prev.name = String(row.party_name);
    } else {
      bySlug.set(slug, {
        id: row.party_id ?? slug,
        name: String(row.party_name || slug),
        nick: String(row.party_nickname || row.party_name || slug),
        slug,
        color: String(row.party_color || "#14934E"),
        leading,
        won,
        seats: won,
        proportionalVotes: num(row.samanupatik),
        proportionalSeats: num(row.samanupatik_seat),
        won2079: 0,
      });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.won - a.won || b.leading - a.leading);
}

const globalRef = globalThis as typeof globalThis & {
  __koLiveSyncAt__?: number;
  __koLiveSyncPromise__?: Promise<{ ok: true; paused: boolean; at: string; desk: ElectionData }>;
};

export const getElectionDesk = createServerFn({ method: "GET" }).handler(async () => readElectionDesk());

export const syncElectionFeed = createServerFn({ method: "POST" }).handler(async () => {
  const now = Date.now();
  if (globalRef.__koLiveSyncPromise__ && now - (globalRef.__koLiveSyncAt__ ?? 0) < 30_000) {
    return globalRef.__koLiveSyncPromise__;
  }
  const run = (async () => {
    const desk = await readElectionDesk();
    if (desk.live?.enabled === false) {
      return { ok: true as const, paused: true, at: desk.live.at ?? "", desk };
    }
    try {
      const res = await fetch(RESULTS_URL, { headers: { "User-Agent": "KalaiyaOnline-Election/1.0" } });
      if (!res.ok) throw new Error(`feed ${res.status}`);
      const json = (await res.json()) as { data?: { party_results?: FeedParty[]; total?: { leading?: number; win?: number; total_seat?: number; samanupatik?: number } } };
      const feed = { parties: json.data?.party_results ?? [], total: json.data?.total ?? {} };
      desk.parties = mergeParties(desk.parties ?? [], feed.parties);
      desk.national.declaredSeats = num(feed.total.win) || desk.parties.reduce((n, p) => n + p.won, 0);
      desk.national.leadingSeats = num(feed.total.leading);
      desk.national.directSeats = num(feed.total.total_seat) || desk.national.directSeats;
      if (feed.total.samanupatik) desk.national.proportionalVotes = num(feed.total.samanupatik);
      const at = new Date().toISOString();
      desk.updated = at.slice(0, 10);
      desk.live = { enabled: true, at, ok: true };
      await writeElectionDesk(desk);
      return { ok: true as const, paused: false, at, desk };
    } catch {
      desk.live = { enabled: desk.live?.enabled !== false, at: desk.live?.at ?? "", ok: false };
      return { ok: true as const, paused: false, at: desk.live.at, desk };
    }
  })();
  globalRef.__koLiveSyncAt__ = now;
  globalRef.__koLiveSyncPromise__ = run;
  return run;
});

export const setElectionLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAppAdmin(context.userId);
    const desk = await readElectionDesk();
    desk.live = { enabled: data.enabled, at: desk.live?.at ?? "", ok: desk.live?.ok ?? false };
    await writeElectionDesk(desk);
    return desk;
  });
