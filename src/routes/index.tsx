import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { PostSidebar } from "@/components/post-sidebar";
import {
  articleHasCategory,
  byLatest,
  displayTitle,
  isHeadlineArticle,
  toNpDigits,
  type Article,
} from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { listPublishedStories } from "@/lib/desk";
import { deskToArticle } from "@/lib/edition";
import { getStoryEngagement } from "@/lib/engagement";
import { categoryLabel, useCategories } from "@/lib/use-categories";

export const Route = createFileRoute("/")({ component: Home });

const CATEGORY_ORDER = [
  "local",
  "politics",
  "business",
  "sports",
  "crime",
  "health",
  "community",
  "development",
];

function Home() {
  const cats = useCategories();
  const [edition, setEdition] = useState<Article[]>([]);
  const [comments, setComments] = useState<Record<string, number>>({});

  useEffect(() => {
    void listPublishedStories()
      .then((rows) => {
        setEdition(
          (rows ?? [])
            .flatMap((row) => {
              try {
                return [deskToArticle(row)];
              } catch {
                return [];
              }
            })
            .sort(byLatest),
        );
      })
      .catch(() => setEdition([]));
  }, []);

  const headlines = useMemo(
    () => edition.filter((a) => isHeadlineArticle(a)).slice(0, 2),
    [edition],
  );

  const sections = useMemo(() => {
    const used = new Set(headlines.map((a) => a.slug));
    const preferred = CATEGORY_ORDER.map((slug) => cats.find((c) => c.slug === slug)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c),
    );
    const extra = cats.filter(
      (c) => c.slug !== "headline" && !CATEGORY_ORDER.includes(c.slug),
    );
    const out: { slug: string; label: string; items: Article[] }[] = [];
    for (const cat of [...preferred, ...extra]) {
      const items = edition
        .filter(
          (a) =>
            !used.has(a.slug) && articleHasCategory(a, cat.slug, cat.label),
        )
        .slice(0, 5);
      if (!items.length) continue;
      for (const a of items) used.add(a.slug);
      out.push({ slug: cat.slug, label: cat.label || categoryLabel(cats, cat.slug), items });
    }
    return out;
  }, [cats, edition, headlines]);

  useEffect(() => {
    if (!headlines.length) return;
    void Promise.all(
      headlines.map((a) =>
        getStoryEngagement({ data: { slug: a.slug } })
          .then((row) => [a.slug, row.comments.length] as const)
          .catch(() => [a.slug, 0] as const),
      ),
    ).then((rows) => {
      const map: Record<string, number> = {};
      for (const [slug, n] of rows) map[slug] = n;
      setComments(map);
    });
  }, [headlines]);

  if (!edition.length) {
    return <div className="min-h-[30vh]" />;
  }

  return (
    <div className="space-y-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        {headlines.map((article) => (
          <div key={article.slug}>
            <Link to="/article/$slug" params={{ slug: article.slug }} className="block">
              <h2 className="text-center font-display text-[35px] font-bold leading-[1.28] text-ink md:text-[40px] lg:text-[50px]">
                {displayTitle(article)}
              </h2>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-crimson/20 bg-chip px-3 py-1.5">
                  <img src="/logo.jpg" alt="" className="size-6 rounded-full object-cover" />
                  <span className="text-sm font-bold text-crimson">कलैयाअनलाइन</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft">
                  <CalendarDays className="size-4 text-mark" />
                  {formatBsDateTime(article.date)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft">
                  <MessageSquare className="size-4 text-crimson" />
                  {toNpDigits(comments[article.slug] ?? 0)}
                </span>
              </div>
              {article.imageUrl ? (
                <img src={article.imageUrl} alt="" className="mt-6 w-full object-cover" />
              ) : null}
            </Link>
            <div className="my-10 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-line-strong to-mark/70" />
              <span className="size-1.5 rotate-45 bg-crimson" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-line-strong to-mark/70" />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          {sections.map((section) => (
            <section key={section.slug}>
              <div className="mb-4 flex items-center justify-between border-b-[3px] border-crimson">
                <h2 className="bg-crimson px-4 py-1.5 font-display text-lg font-bold text-white sm:text-xl">
                  {section.label}
                </h2>
                <Link
                  to="/category/$slug"
                  params={{ slug: section.slug }}
                  className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-crimson hover:underline"
                >
                  थप
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              {section.items[0] ? (
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                  <ArticleCard article={section.items[0]} variant="lead" />
                </div>
              ) : null}
              {section.items.length > 1 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {section.items.slice(1).map((article) => (
                    <Link
                      key={article.slug}
                      to="/article/$slug"
                      params={{ slug: article.slug }}
                      className="group flex gap-3 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-crimson/35 hover:shadow-md"
                    >
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="h-[5.5rem] w-[6.5rem] shrink-0 rounded-lg object-cover sm:h-24 sm:w-28"
                        />
                      ) : (
                        <span className="h-[5.5rem] w-[6.5rem] shrink-0 rounded-lg bg-gradient-to-br from-crimson to-ink sm:h-24 sm:w-28" />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                        <span className="line-clamp-3 font-display text-[15px] font-bold leading-snug text-ink group-hover:text-crimson sm:text-base">
                          {displayTitle(article)}
                        </span>
                        <span className="mt-2 text-xs text-muted">
                          {formatBsDateTime(article.date)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
        <PostSidebar articles={edition} limit={7} />
      </div>
    </div>
  );
}
