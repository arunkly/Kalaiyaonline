import { createServerFn } from "@tanstack/react-start";

export type NepseStock = {
  symbol: string;
  ltp: number;
  percent: number;
};

export type NepseTicker = {
  asOf: string;
  indexValue: number;
  change: number;
  percent: number;
  stocks: NepseStock[];
};

const FALLBACK: NepseTicker = {
  asOf: "",
  indexValue: 2542.77,
  change: 4.66,
  percent: 0.18,
  stocks: [
    { symbol: "NABIL", ltp: 0, percent: 0 },
    { symbol: "NICA", ltp: 0, percent: 0 },
    { symbol: "GBIME", ltp: 0, percent: 0 },
  ],
};

let cache: { at: number; data: NepseTicker } | null = null;

async function readJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "KalaiyaOnline/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`nepse ${res.status}`);
  return res.json();
}

export const getNepseTicker = createServerFn({ method: "GET" }).handler(
  async () => {
    if (cache && Date.now() - cache.at < 60_000) return cache.data;
    try {
      const [idx, market] = await Promise.all([
        readJson("https://nepalipaisa.com/api/GetIndexLive"),
        readJson(
          "https://merolagani.com/handlers/webrequesthandler.ashx?type=market_summary",
        ),
      ]);
      const nepse = (idx?.result ?? []).find(
        (row: { indexName?: string }) => row.indexName === "Nepse",
      );
      const stocks: NepseStock[] = (market?.turnover?.detail ?? [])
        .slice(0, 24)
        .map((row: { s?: string; lp?: number; pc?: number }) => ({
          symbol: String(row.s ?? "").toUpperCase(),
          ltp: Number(row.lp ?? 0),
          percent: Number(row.pc ?? 0),
        }))
        .filter((row: NepseStock) => row.symbol);
      const data: NepseTicker = {
        asOf: String(market?.overall?.d ?? nepse?.asOf ?? ""),
        indexValue: Number(nepse?.indexValue ?? 0),
        change: Number(nepse?.difference ?? 0),
        percent: Number(nepse?.percentChange ?? 0),
        stocks,
      };
      if (!data.indexValue && !data.stocks.length) return FALLBACK;
      cache = { at: Date.now(), data };
      return data;
    } catch {
      return cache?.data ?? FALLBACK;
    }
  },
);
