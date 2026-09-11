import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { baraLocals, baraSeats, formatInt, frontPageOf, partyShort, seatLabel, type ElectionData } from "@/lib/election";
import { getElectionDesk } from "@/lib/election-desk";
import { useFeature } from "@/components/features-provider";

export function ElectionStrip() {
  const on = useFeature("election");
  const [desk, setDesk] = useState<ElectionData | null>(null);
  useEffect(() => {
    if (!on) return;
    void getElectionDesk()
      .then(setDesk)
      .catch(() => undefined);
  }, [on]);
  if (!on || !desk) return null;
  const page = frontPageOf(desk);
  const seats = baraSeats(desk);
  const locals = baraLocals(desk).slice(0, 4);
  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-2xl">निर्वाचन अपडेट</p>
        <Link to="/election" className="text-sm font-semibold text-[#14934e]">
          सबै ›
        </Link>
      </div>
      {page === "local" ? (
        <>
          <p className="text-xs text-muted">बारा · स्थानीय निकाय निर्वाचन</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {locals.map((b) => (
              <li key={b.id}>
                <Link to="/election/local/$id" params={{ id: b.id }} className="block rounded-xl bg-paper px-3 py-3 hover:bg-chip">
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted">{b.winnerName || "नतिजा आउन बाँकी"}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-xs text-muted">बारा · प्रतिनिधिसभा · घोषित {formatInt(seats.filter((c) => c.winnerName).length)} / {formatInt(4)}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {seats.map((c) => (
              <li key={c.id}>
                <Link to="/election/$id" params={{ id: c.id }} className="block rounded-xl bg-paper px-3 py-3 hover:bg-chip">
                  <p className="text-sm font-semibold">{seatLabel(c, "np")}</p>
                  <p className="mt-1 text-xs text-muted">
                    {c.winnerName || "बाँकी"}
                    {c.winnerParty ? ` · ${partyShort(c.winnerParty, c.winnerPartySlug)}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
