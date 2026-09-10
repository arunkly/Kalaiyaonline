import { Link, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ElectionProvider, useElection } from "@/lib/election-live";
import {
  DISTRICTS,
  LOCAL_BODY_TYPES,
  LOCAL_POSTS,
  activeKinds,
  displayPlan,
  formatInt,
  frontPageOf,
  localBodiesOf,
  madheshSeatShare,
  partyShort,
  partyTone,
  pct,
  seatLabel,
  siteCopy,
} from "@/lib/election";

export const Route = createFileRoute("/election")({ component: ElectionRoute });

function ElectionRoute() {
  return (
    <ElectionProvider>
      <ElectionHome />
    </ElectionProvider>
  );
}

function ElectionHome() {
  const { data: election } = useElection();
  const site = siteCopy(election);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("all");
  const share = useMemo(() => madheshSeatShare(election), [election]);
  const nationalTop = election.parties.filter((p) => p.won > 0);
  const locals = localBodiesOf(election);
  const page = frontPageOf(election);
  const shown = activeKinds(displayPlan(election));

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return election.constituencies.filter((c) => {
      if (district !== "all" && c.districtEn !== district && c.districtNp !== district) return false;
      if (!query) return true;
      return [c.nameNp, c.nameEn, c.districtEn, c.districtNp, c.winnerName, c.winnerParty].join(" ").toLowerCase().includes(query);
    });
  }, [q, district, election.constituencies]);

  const declared = election.constituencies.filter((c) => c.winnerName).length;
  const totalVotes = election.constituencies.reduce((n, c) => n + c.votesCounted, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-crimson">
          {page === "local" ? "स्थानीय तह निर्वाचन · मधेश प्रदेश" : site.kicker}
          {page === "hor" ? (
            <span className="inline-flex items-center gap-1.5 tracking-normal text-[#14934e]">
              <span className="size-1.5 animate-pulse rounded-full bg-[#14934e]" />
              लाइभ
              {election.live?.at ? (
                <span className="font-mono text-[11px] text-muted">
                  {new Date(election.live.at).toLocaleTimeString("ne-NP", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </span>
          ) : null}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
          {page === "local" ? "स्थानीय तहको नतिजा।" : site.headline}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          {page === "local" ? "गाउँपालिका, नगरपालिका, उपमहानगर र महानगरका प्रमुख/अध्यक्ष नतिजा।" : site.intro}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {page === "hor" ? (
            <>
              <Stat label="घोषित सिट" value={`${formatInt(declared)} / ${formatInt(32)}`} />
              <Stat label="मतदाता" value={formatInt(election.madhesh.voters)} />
              <Stat label="गणना भएको मत" value={formatInt(totalVotes)} />
              <Stat label="मतदान केन्द्र" value={formatInt(election.madhesh.pollingCenters)} />
            </>
          ) : (
            <>
              <Stat label="निकाय" value={formatInt(locals.length)} />
              <Stat label="घोषित" value={formatInt(locals.filter((b) => b.winnerName).length)} />
              <Stat label="जिल्ला" value={formatInt(8)} />
              <Stat label="उम्मेदवार" value={formatInt(locals.reduce((n, b) => n + b.candidates.length, 0))} />
            </>
          )}
        </dl>
      </section>

      {page === "hor" && (shown.has("madhesh") || shown.has("national")) ? (
        <section className="grid gap-6 bg-white p-5 sm:p-8 lg:grid-cols-12">
          {shown.has("madhesh") ? (
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl">मधेशमा दलअनुसार सिट</h2>
              <ul className="mt-5 space-y-3">
                {share.map((row) => {
                  const width = pct(row.seats, Math.max(32, share.reduce((n, r) => n + r.seats, 0)));
                  return (
                    <li key={row.slug || row.party}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{partyShort(row.party, row.slug)}</span>
                        <span className="tabular-nums text-muted">{formatInt(row.seats)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-chip">
                        <div className="h-full rounded-full" style={{ width: `${width}%`, background: partyTone(row.slug) }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {shown.has("national") ? (
            <div className="rounded-2xl border border-line bg-paper p-5 lg:col-span-5">
              <h2 className="font-display text-xl">राष्ट्रिय प्रत्यक्ष सिट</h2>
              <p className="mt-1 text-xs text-muted">१६५ मध्ये {formatInt(election.national.declaredSeats)} घोषित</p>
              <ol className="mt-4 space-y-2">
                {nationalTop.map((p) => (
                  <li key={p.slug} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full" style={{ background: partyTone(p.slug, p.color) }} />
                      {p.nick}
                    </span>
                    <span className="tabular-nums text-sm">{formatInt(p.won)}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}

      {page === "local" ? (
        <section className="bg-white p-5 sm:p-8">
          <h2 className="font-display text-2xl">स्थानीय तह नतिजा</h2>
          {locals.length ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {locals.map((b) => (
                <li key={b.id}>
                  <Link to="/election/local/$id" params={{ id: b.id }} className="block rounded-2xl border border-line p-4 hover:border-crimson">
                    <p className="text-xs text-muted">
                      {b.districtNp} · {LOCAL_BODY_TYPES.find((t) => t.id === b.type)?.label ?? b.type}
                      {b.ward ? ` · वडा ${b.ward}` : ""}
                    </p>
                    <h3 className="mt-1 font-display text-xl">{b.name}</h3>
                    <p className="mt-2 text-sm font-medium">
                      {b.winnerName || "नतिजा आउन बाँकी"}
                      {b.winnerVotes ? ` · ${formatInt(b.winnerVotes)} मत` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">अहिलेसम्म स्थानीय तहको नतिजा थपिएको छैन।</p>
          )}
        </section>
      ) : null}

      {page === "hor" && shown.has("hor") ? (
        <section className="bg-white p-5 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl">क्षेत्रगत नतिजा</h2>
              <p className="mt-1 text-sm text-muted">{formatInt(rows.length)} क्षेत्र</p>
            </div>
            <label className="relative block w-full md:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="क्षेत्र, उम्मेदवार, दल"
                className="h-11 w-full rounded-xl border border-line bg-paper pr-3 pl-10 text-sm outline-none focus:border-crimson"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setDistrict("all")}
              className={district === "all" ? "rounded-full bg-crimson px-3 py-1.5 text-xs font-bold text-paper" : "rounded-full bg-chip px-3 py-1.5 text-xs font-semibold"}
            >
              सबै जिल्ला
            </button>
            {DISTRICTS.map((d) => (
              <button
                key={d.en}
                type="button"
                onClick={() => setDistrict(d.en)}
                className={district === d.en ? "rounded-full bg-crimson px-3 py-1.5 text-xs font-bold text-paper" : "rounded-full bg-chip px-3 py-1.5 text-xs font-semibold"}
              >
                {d.np}
              </button>
            ))}
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {rows.map((c) => {
              const runner = c.candidates.find((x) => !x.winner);
              const margin = c.winnerVotes && runner ? c.winnerVotes - runner.votes : 0;
              return (
                <li key={c.id}>
                  <Link to="/election/$id" params={{ id: c.id }} className="block rounded-2xl border border-line p-4 hover:border-crimson">
                    <p className="text-xs text-muted">{c.districtNp}</p>
                    <h3 className="mt-1 font-display text-xl">{seatLabel(c, "np")}</h3>
                    <p className="mt-2 text-sm font-semibold">{c.winnerName || "नतिजा आउन बाँकी"}</p>
                    <p className="text-xs text-muted">
                      {c.winnerParty ? partyShort(c.winnerParty, c.winnerPartySlug) : ""}
                      {c.winnerVotes ? ` · ${formatInt(c.winnerVotes)} मत` : ""}
                      {margin > 0 ? ` · अन्तर ${formatInt(margin)}` : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-3 py-3">
      <p className="text-[11px] font-bold text-muted">{label}</p>
      <p className="mt-1 font-display text-xl">{value}</p>
    </div>
  );
}
