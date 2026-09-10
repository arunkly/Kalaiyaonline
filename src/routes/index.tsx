import { Link, createFileRoute } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { isHeadline, type Article } from "@/data/articles";
import { listGalleryPosts, type GalleryPost } from "@/lib/gallery-desk";
import { listDirCategories, listDirEntries, type DirCategory, type DirItem } from "@/lib/directory-desk";
import { DirectoryListing } from "@/components/directory-listing";
import { PostSidebar } from "@/components/post-sidebar";
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
  const [albums, setAlbums] = useState<GalleryPost[]>([]);
  const [places, setPlaces] = useState<DirItem[]>([]);
  const [dirCats, setDirCats] = useState<DirCategory[]>([]);
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
  const hero = headlines[0];
  const moreHeadlines = headlines.slice(1, 6);
  const pool = all.filter((a) => !isHeadline(a.category));

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

      {hero ? (
        <ArticleCard article={hero} variant="hero" />
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-[#b3c7ba] bg-white px-5 py-16 text-center">
          <p className="font-display text-3xl">हेडलाइन छैन</p>
        </div>
      )}

      {moreHeadlines.length ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <p className="font-display text-2xl">थप हेडलाइन</p>
            <Link to="/category/$slug" params={{ slug: "headline" }} className="text-sm font-semibold text-[#14934e]">
              सबै
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {moreHeadlines.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          {sections.map((section) => (
            <section key={section.slug}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <p className="font-display text-2xl">{section.label}</p>
                <Link
                  to="/category/$slug"
                  params={{ slug: section.slug }}
                  className="text-sm font-semibold text-[#14934e]"
                >
                  सबै
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.items.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="lg:col-span-4">
          <PostSidebar articles={all} limit={10} numbered />
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-[1.5rem] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-2xl">ग्यालरी</p>
            <Link to="/gallery" className="text-sm font-semibold text-[#14934e]">
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
                    className="w-40 shrink-0 snap-start sm:w-36"
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="h-28 w-full rounded-xl object-cover sm:h-24" />
                    ) : (
                      <div className="h-28 rounded-xl bg-chip sm:h-24" />
                    )}
                    <p className="mt-2 line-clamp-2 text-sm">{g.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        <section className="rounded-[1.5rem] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-2xl">डाइरेक्ट्री</p>
            <Link to="/directory" className="text-sm font-semibold text-[#14934e]">
              सबै
            </Link>
          </div>
          <ul className="space-y-2">
            {places.slice(0, 4).map((d) => (
              <li key={d.id}>
                <DirectoryListing item={d} compact categoryLabel={dirCats.find((c) => c.slug === d.category)?.label} />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <AdSlot slot="home-sidebar" />
    </div>
  );
}
