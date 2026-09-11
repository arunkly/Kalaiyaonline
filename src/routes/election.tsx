import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ElectionProvider, useElection } from "@/lib/election-live";
import { PoliticiansSidebar } from "@/components/election-people";
import {
  LOCAL_BODY_TYPES,
  baraLocals,
  baraSeats,
  formatInt,
  frontPageOf,
  partyShort,
  seatLabel,
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
  const seats = baraSeats(election);
  const locals = baraLocals(election);
  const [tab, setTab] = useState<"hor" | "local">(frontPageOf(election));
  const declared = seats.filter((c) => c.winnerName).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
    <div className="min-w-0 space-y-8">
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-crimson">निर्वाचन अपडेट · बारा जिल्ला</p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
          {tab === "local" ? "बाराको स्थानीय निकाय नतिजा।" : "बाराका ४ क्षेत्रको नतिजा।"}
        </h1>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("hor")}
            className={tab === "hor" ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper" : "rounded-full border border-line px-4 py-2 text-sm"}
          >
            प्रतिनिधिसभा
          </button>
          <button
            type="button"
            onClick={() => setTab("local")}
            className={tab === "local" ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper" : "rounded-full border border-line px-4 py-2 text-sm"}
          >
            स्थानीय निकाय
          </button>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tab === "hor" ? (
            <>
              <Stat label="क्षेत्र" value={formatInt(4)} />
              <Stat label="घोषित" value={`${formatInt(declared)} / ${formatInt(4)}`} />
              <Stat label="उम्मेदवार" value={formatInt(seats.reduce((n, c) => n + c.candidates.length, 0))} />
              <Stat label="गणना मत" value={formatInt(seats.reduce((n, c) => n + c.votesCounted, 0))} />
            </>
          ) : (
            <>
              <Stat label="निकाय" value={formatInt(locals.length)} />
              <Stat label="घोषित" value={formatInt(locals.filter((b) => b.winnerName).length)} />
              <Stat label="उम्मेदवार" value={formatInt(locals.reduce((n, b) => n + b.candidates.length, 0))} />
              <Stat label="जिल्ला" value="बारा" />
            </>
          )}
        </dl>
      </section>

      {tab === "hor" ? (
        <section className="bg-white p-5 sm:p-8">
          <h2 className="font-display text-2xl">प्रतिनिधिसभा · बारा</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {seats.map((c) => (
              <li key={c.id}>
                <Link to="/election/$id" params={{ id: c.id }} className="block rounded-2xl border border-line p-4 hover:border-crimson">
                  <p className="text-xs text-muted">बारा</p>
                  <h3 className="mt-1 font-display text-xl">{seatLabel(c, "np")}</h3>
                  <p className="mt-2 text-sm font-semibold">{c.winnerName || "नतिजा आउन बाँकी"}</p>
                  <p className="text-xs text-muted">
                    {c.winnerParty ? partyShort(c.winnerParty, c.winnerPartySlug) : ""}
                    {c.winnerVotes ? ` · ${formatInt(c.winnerVotes)} मत` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="bg-white p-5 sm:p-8">
          <h2 className="font-display text-2xl">स्थानीय निकाय · बारा</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {locals.map((b) => (
              <li key={b.id}>
                <Link to="/election/local/$id" params={{ id: b.id }} className="block rounded-2xl border border-line p-4 hover:border-crimson">
                  <p className="text-xs text-muted">
                    {LOCAL_BODY_TYPES.find((t) => t.id === b.type)?.label ?? b.type}
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
        </section>
      )}
    </div>
    <PoliticiansSidebar data={election} />
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
