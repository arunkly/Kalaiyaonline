import { useEffect, useState } from "react";
import { getNepseTicker, type NepseTicker } from "@/lib/nepse";
import { cn } from "@/lib/cn";

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-NP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function Chip({
  label,
  value,
  percent,
}: {
  label: string;
  value?: string;
  percent: number;
}) {
  const up = percent >= 0;
  return (
    <span className="inline-flex items-center gap-2 px-4 text-sm">
      <span className="font-semibold">{label}</span>
      {value ? <span className="tabular-nums">{value}</span> : null}
      <span className={cn("tabular-nums font-semibold", up ? "text-crimson" : "text-mark")}>
        {up ? "▲" : "▼"} {fmt(Math.abs(percent))}%
      </span>
    </span>
  );
}

export function MarketTicker() {
  const [data, setData] = useState<NepseTicker | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void getNepseTicker()
        .then((row) => {
          if (alive) setData(row);
        })
        .catch(() => undefined);
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="overflow-hidden border-b border-line bg-ink text-paper">
        <p className="px-4 py-2 text-xs tracking-wide text-paper/70">NEPSE टिकर लोड हुँदै…</p>
      </div>
    );
  }

  const items = [
    <Chip
      key="nepse"
      label="NEPSE"
      value={fmt(data.indexValue)}
      percent={data.percent}
    />,
    ...data.stocks.map((s) => (
      <Chip key={s.symbol} label={s.symbol} value={fmt(s.ltp)} percent={s.percent} />
    )),
  ];

  return (
    <div className="border-b border-line bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <p className="shrink-0 bg-mark px-3 py-2 text-[11px] font-bold tracking-wider">
          NEPSE LIVE
        </p>
        <div className="ticker-mask min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track py-2">
            {items}
            {items}
          </div>
        </div>
      </div>
    </div>
  );
}
