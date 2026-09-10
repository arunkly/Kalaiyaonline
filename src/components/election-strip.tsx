import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatInt, madheshSeatShare, partyShort, type ElectionData } from "@/lib/election";
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
  const share = madheshSeatShare(desk).slice(0, 4);
  const declared = desk.constituencies.filter((c) => c.winnerName).length;
  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-2xl">निर्वाचन अपडेट</p>
        <Link to="/election" className="text-sm font-semibold text-[#14934e]">
          सबै ›
        </Link>
      </div>
      <p className="text-xs text-muted">
        मधेश प्रदेश · प्रतिनिधिसभा २०८२ · घोषित {formatInt(declared)} / {formatInt(32)}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {share.map((row) => (
          <li key={row.slug || row.party} className="rounded-xl bg-paper px-3 py-3">
            <p className="text-sm font-semibold">{partyShort(row.party, row.slug)}</p>
            <p className="font-display text-2xl">{formatInt(row.seats)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
