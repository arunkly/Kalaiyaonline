import { useEffect, useState } from "react";
import { formatInt, madheshSeatShare, partyShort, type ElectionData } from "@/lib/election";
import { getElectionDesk, setElectionLive, syncElectionFeed } from "@/lib/election-desk";

export function ElectionDeskPanel() {
  const [desk, setDesk] = useState<ElectionData | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void getElectionDesk()
      .then(setDesk)
      .catch(() => undefined);
  }, []);

  const share = desk ? madheshSeatShare(desk) : [];
  const liveOn = desk?.live?.enabled !== false;

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">निर्वाचन डेस्क</h2>
      <p className="text-sm text-muted">मधेश प्रदेश प्रतिनिधिसभा २०८२ — OnlineKhabar लाइभ फिड।</p>
      {msg ? <p className="text-sm font-semibold text-[#14934e]">{msg}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setMsg(null);
            void syncElectionFeed()
              .then((r) => {
                setDesk(r.desk);
                setMsg(r.paused ? "लाइभ बन्द छ।" : "फिड अपडेट भयो।");
              })
              .catch(() => setMsg("फिड आएन।"))
              .finally(() => setBusy(false));
          }}
          className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {busy ? "अपडेट हुँदै…" : "लाइभ फिड तान्नुहोस्"}
        </button>
        <button
          type="button"
          disabled={busy || !desk}
          onClick={() => {
            if (!desk) return;
            setBusy(true);
            void setElectionLive({ data: { enabled: !liveOn } })
              .then((next) => {
                setDesk(next);
                setMsg(liveOn ? "लाइभ बन्द।" : "लाइभ खुला।");
              })
              .finally(() => setBusy(false));
          }}
          className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm font-semibold"
        >
          {liveOn ? "लाइभ बन्द गर्नुहोस्" : "लाइभ खोल्नुहोस्"}
        </button>
      </div>
      {desk ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-paper p-3">
            <p className="text-[11px] text-muted">घोषित सिट</p>
            <p className="font-display text-xl">{formatInt(desk.constituencies.filter((c) => c.winnerName).length)}</p>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <p className="text-[11px] text-muted">राष्ट्रिय जित</p>
            <p className="font-display text-xl">{formatInt(desk.national.declaredSeats)}</p>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <p className="text-[11px] text-muted">लाइभ</p>
            <p className="font-display text-xl">{liveOn ? "खुला" : "बन्द"}</p>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <p className="text-[11px] text-muted">अपडेट</p>
            <p className="text-sm">{desk.live?.at ? new Date(desk.live.at).toLocaleString("ne-NP") : desk.updated}</p>
          </div>
        </dl>
      ) : null}
      {share.length ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {share.map((row) => (
            <li key={row.slug || row.party} className="flex justify-between px-4 py-2 text-sm">
              <span>{partyShort(row.party, row.slug)}</span>
              <span>{formatInt(row.seats)} सिट</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
