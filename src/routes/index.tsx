import { Link, createFileRoute } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { isHeadline, formatDate, type Article } from "@/data/articles";
import { listGalleryPosts, type GalleryPost } from "@/lib/gallery-desk";
import { listDirCategories, listDirEntries, type DirCategory, type DirItem } from "@/lib/directory-desk";
import { DirectoryListing } from "@/components/directory-listing";
import { PostSidebar } from "@/components/post-sidebar";
import { useFeatures } from "@/components/features-provider";
import { getStoryEngagement } from "@/lib/engagement";
import { useEdition } from "@/lib/edition";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

const SECTION_ORDER = ["local", "politics", "business", "sports"];

function matchesCategory(article: Article, slug: string, label: string) {
  const cat = (article.category || "").toLowerCase();
  return cat === slug.toLowerCase() || cat === label.toLowerCase() || article.category === label;
}

function Home() {
  const edition = useEdition();
  const cats = useCategories();
  const features = useFeatures();
  const [albums, setAlbums] = useState<GalleryPost[]>([]);
  const [places, setPlaces] = useState<DirItem[]>([]);
  const [dirCats, setDirCats] = useState<DirCategory[]>([]);
  const [comments, setComments] = useState<Record<string, number>>({});
  useEffect(() => {
    void listGalleryPosts()
      .then(setAlbums)
      .catch(() => undefined);
    void Promise.all([listDirEntries(), listDirCategories()])
      .then(([rows, nextCats]) => {
        setPlaces(rows);
        setDirCats(nextCats);
      })
      .catch(() => undefined);
  }, []);

  const all = useMemo(() => [...edition].sort((a, b) => (a.date < b.date ? 1 : -1)), [edition]);
  const headlines = all.filter((a) => isHeadline(a.category));
  const topTwo = useMemo(() => {
    if (headlines.length >= 2) return headlines.slice(0, 2);
    const rest = all.filter((a) => !headlines.some((h) => h.slug === a.slug));
    return [...headlines, ...rest].slice(0, 2);
  }, [all, headlines]);
  const pool = all.filter((a) => !topTwo.some((h) => h.slug === a.slug) && !isHeadline(a.category));

  useEffect(() => {
    if (!topTwo.length) return;
    void Promise.all(
      topTwo.map((a) =>
        getStoryEngagement({ data: { slug: a.slug } })
          .then((row) => [a.slug, row.comments.length] as const)
          .catch(() => [a.slug, 0] as const),
      ),
    ).then((rows) => {
      const map: Record<string, number> = {};
      for (const [slug, n] of rows) map[slug] = n;
      setComments(map);
    });
  }, [topTwo]);

  const orderedCats = useMemo(() => {
    const rest = cats.filter((c) => c.slug !== "headline" && !SECTION_ORDER.includes(c.slug));
    const first = SECTION_ORDER.map((slug) => cats.find((c) => c.slug === slug)).filter(Boolean);
    return [...first, ...rest] as typeof cats;
  }, [cats]);

  const sections = orderedCats
    .map((c) => ({
      slug: c.slug,
      label: c.label || categoryLabel(cats, c.slug),
      items: pool.filter((a) => matchesCategory(a, c.slug, c.label)).slice(0, 5),
    }))
    .filter((s) => s.items.length);

  return (
    <div className="space-y-8">
      <AdSlot slot="home-top" />

      <div className="flex items-center justify-between border-y border-line py-2 text-xs font-semibold text-muted">
        <span>आज · {formatDate(new Date())}</span>
        <span>कलैया · बारा · मधेश</span>
      </div>

      {topTwo.length ? (
        <section className="grid gap-10 md:grid-cols-2 md:gap-8">
          {topTwo.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="headline" comments={comments[a.slug] ?? 0} />
          ))}
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-5 py-16 text-center">
          <p className="font-display text-3xl font-extrabold">हेडलाइन छैन</p>
          <p className="mt-2 text-sm text-muted">नयाँ समाचार प्रकाशित हुनेबित्तिकै यहाँ देखिन्छ।</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          {sections.map((section) => {
            const [lead, ...rest] = section.items;
            return (
              <section key={section.slug}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 className="section-title flex-1">{section.label}</h2>
                  <Link
                    to="/category/$slug"
                    params={{ slug: section.slug }}
                    className="shrink-0 text-sm font-bold text-crimson"
                  >
                    सबै
                  </Link>
                </div>
                {lead ? <ArticleCard article={lead} variant="lead" /> : null}
                {rest.length ? (
                  <div className="mt-1">
                    {rest.map((a) => (
                      <ArticleCard key={a.slug} article={a} variant="compact" />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
        <div className="lg:col-span-4">
          <PostSidebar articles={all} limit={10} numbered />
        </div>
      </div>

      {features.gallery || features.directory ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          {features.gallery ? (
            <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="section-title flex-1">ग्यालरी</h2>
                <Link to="/gallery" className="text-sm font-bold text-crimson">
                  सबै
                </Link>
              </div>
              <div className="-mx-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory touch-pan-x [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-3 px-4 pb-1">
                  {albums.slice(0, 12).map((g) => {
                    const thumb = g.coverUrl || g.photos[0]?.imageUrl;
                    return (
                      <Link
                        key={g.slug}
                        to="/gallery/$slug"
                        params={{ slug: g.slug }}
                        className="relative w-44 shrink-0 snap-start overflow-hidden rounded-md sm:w-40"
                      >
                        {thumb ? (
                          <img src={thumb} alt="" className="h-36 w-full object-cover sm:h-32" />
                        ) : (
                          <div className="h-36 bg-chip sm:h-32" />
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-2 pt-8">
                          <p className="line-clamp-2 text-sm font-semibold text-paper">{g.title}</p>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}
          {features.directory ? (
            <section className="rounded-lg border border-line bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="section-title flex-1">डाइरेक्ट्री</h2>
                <Link to="/directory" className="text-sm font-bold text-crimson">
                  सबै
                </Link>
              </div>
              <ul className="space-y-1">
                {places.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    <DirectoryListing item={d} compact categoryLabel={dirCats.find((c) => c.slug === d.category)?.label} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
      <AdSlot slot="home-sidebar" />
    </div>
  );
}
