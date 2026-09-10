import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ElectionProvider, useElection } from "@/lib/election-live";
import { formatInt, getConstituency, partyShort, partyTone, pct, seatLabel } from "@/lib/election";

export const Route = createFileRoute("/election/$id")({ component: SeatRoute });

function SeatRoute() {
  return (
    <ElectionProvider>
      <SeatPage />
    </ElectionProvider>
  );
}

function SeatPage() {
  const { id } = Route.useParams();
  const { data } = useElection();
  const seat = getConstituency(id, data);

  if (!seat) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">क्षेत्र भेटिएन।</p>
        <Link to="/election" className="mt-4 inline-block text-sm text-crimson">
          चुनाव डेस्क
        </Link>
      </div>
    );
  }

  const maxVotes = Math.max(...seat.candidates.map((c) => c.votes), 1);
  const turnout = seat.voters > 0 ? pct(seat.votesCounted, seat.voters) : 0;
  const nearby = data.constituencies.filter((c) => c.districtEn === seat.districtEn && c.id !== seat.id);

  return (
    <div className="space-y-6">
      <Link to="/election" className="inline-flex items-center gap-2 text-sm text-muted hover:text-crimson">
        <ArrowLeft className="size-4" />
        सबै क्षेत्र
      </Link>
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <p className="text-xs font-bold tracking-[0.16em] text-crimson">
          {seat.districtNp} · मधेश प्रदेश
        </p>
        <h1 className="mt-2 font-display text-4xl">{seatLabel(seat, "np")}</h1>
        <p className="mt-4 text-xs text-muted">विजयी उम्मेदवार</p>
        <p className="font-display text-2xl">{seat.winnerName || "नतिजा आउन बाँकी"}</p>
        <p className="text-sm text-muted">{partyShort(seat.winnerParty, seat.winnerPartySlug)}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="प्राप्त मत" value={formatInt(seat.winnerVotes)} />
          <Stat label="कुल गणना" value={formatInt(seat.votesCounted)} />
          <Stat label="मतदाता" value={formatInt(seat.voters)} />
          <Stat label="मतदान प्रतिशत" value={`${formatInt(turnout)}%`} />
        </dl>
      </section>
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <h2 className="font-display text-2xl">उम्मेदवार</h2>
        <ul className="mt-4 space-y-3">
          {seat.candidates.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="font-display text-lg">
                    {c.name} {c.winner ? <span className="text-sm text-[#14934e]">विजयी</span> : null}
                  </p>
                  <p className="text-xs text-muted">{partyShort(c.party, c.partySlug)}</p>
                </div>
                <p className="tabular-nums">{formatInt(c.votes)}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-chip">
                <div className="h-full rounded-full" style={{ width: `${pct(c.votes, maxVotes)}%`, background: partyTone(c.partySlug, c.winner ? "#14934e" : undefined) }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      {nearby.length ? (
        <section>
          <h2 className="mb-3 font-display text-xl">सोही जिल्ला</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {nearby.map((c) => (
              <li key={c.id}>
                <Link to="/election/$id" params={{ id: c.id }} className="block rounded-2xl border border-line bg-white p-4 hover:border-crimson">
                  <p className="font-display text-lg">{seatLabel(c, "np")}</p>
                  <p className="text-sm text-muted">{c.winnerName}</p>
                </Link>
              </li>
            ))}
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
