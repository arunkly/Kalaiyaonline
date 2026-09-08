import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { displayTitle, formatDate, toNpDigits, type Article } from "@/data/articles";
import { cn } from "@/lib/cn";
import { getTrending, type TrendingTopic } from "@/lib/trending";
import { listStoryViews } from "@/lib/views";

export function PostSidebar({
  articles,
  currentSlug,
  limit = 8,
  numbered = false,
}: {
  articles: Article[];
  currentSlug?: string;
  limit?: number;
  numbered?: boolean;
}) {
  const [tab, setTab] = useState<"latest" | "popular" | "trending">("latest");
  const [views, setViews] = useState<Record<string, number>>({});
  const [trendSlugs, setTrendSlugs] = useState<string[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    void listStoryViews()
      .then((rows) => {
        const map: Record<string, number> = {};
        for (const r of rows) map[r.slug] = r.views;
        setViews(map);
      })
      .catch(() => undefined);
    void getTrending()
      .then((row) => {
        setTrendSlugs(row.stories.map((s) => s.slug));
        setTopics(row.topics);
      })
      .catch(() => undefined);
  }, []);

  const pool = useMemo(
    () => articles.filter((a) => a.slug !== currentSlug),
    [articles, currentSlug],
  );

  const latest = useMemo(
    () => [...pool].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit),
    [pool, limit],
  );

  const popular = useMemo(
    () =>
      [...pool]
        .sort((a, b) => (views[b.slug] ?? 0) - (views[a.slug] ?? 0) || b.date.localeCompare(a.date))
        .slice(0, limit),
    [pool, views, limit],
  );

  const trending = useMemo(() => {
    const bySlug = new Map(pool.map((a) => [a.slug, a]));
    const ordered = trendSlugs.map((s) => bySlug.get(s)).filter(Boolean) as typeof pool;
    if (ordered.length >= limit) return ordered.slice(0, limit);
    const extra = pool.filter((a) => !ordered.some((o) => o.slug === a.slug));
    return [...ordered, ...extra].slice(0, limit);
  }, [pool, trendSlugs, limit]);

  const list = tab === "latest" ? latest : tab === "popular" ? popular : trending;

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="grid grid-cols-3 border-b border-line">
          {(
            [
              ["latest", "ताजा"],
              ["popular", "लोकप्रिय"],
              ["trending", "ट्रेन्डिङ"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "py-3 text-xs font-bold sm:text-sm",
                tab === id
                  ? id === "popular"
                    ? "bg-[#E87722] text-white"
                    : "bg-[#2E7D32] text-white"
                  : "bg-paper text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {topics.length ? (
          <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
            {topics.slice(0, 8).map((t) => (
              <Link
                key={t.tag}
                to="/search"
                search={{ q: t.tag }}
                className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]"
              >
                #{t.tag}
              </Link>
            ))}
          </div>
        ) : null}
        <ul className="divide-y divide-line">
          {list.map((a, i) => (
            <li key={a.slug}>
              <Link to="/article/$slug" params={{ slug: a.slug }} className="flex gap-3 p-3 hover:bg-[#E8F5E9]">
                {numbered ? (
                  <span className="w-8 shrink-0 font-display text-2xl font-semibold text-[#E87722]">{toNpDigits(i + 1)}</span>
                ) : a.imageUrl ? (
                  <img src={a.imageUrl} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="size-16 shrink-0 rounded-lg bg-chip" />
                )}
                <span className="min-w-0">
                  <span className={cn("line-clamp-3 font-display leading-snug", numbered ? "text-xl" : "text-sm font-semibold")}>
                    {displayTitle(a)}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">{formatDate(a.date)}</span>
                </span>
              </Link>
            </li>
          ))}
          {list.length === 0 ? <li className="p-4 text-sm text-muted">समाचार छैन।</li> : null}
        </ul>
      </div>
    </aside>
  );
}
