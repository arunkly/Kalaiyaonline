import { Link, createFileRoute } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { isHeadline } from "@/data/articles";
import { listGalleryPosts, type GalleryPost } from "@/lib/gallery-desk";
import { listDirCategories, listDirEntries, type DirCategory, type DirItem } from "@/lib/directory-desk";
import { DirectoryListing } from "@/components/directory-listing";
import { useEdition } from "@/lib/edition";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const edition = useEdition();
  const [albums, setAlbums] = useState<GalleryPost[]>([]);
  const [places, setPlaces] = useState<DirItem[]>([]);
  const [dirCats, setDirCats] = useState<DirCategory[]>([]);
  useEffect(() => {
    void listGalleryPosts()
      .then(setAlbums)
      .catch(() => undefined);
    void Promise.all([listDirEntries(), listDirCategories()])
      .then(([rows, cats]) => {
        setPlaces(rows);
        setDirCats(cats);
      })
      .catch(() => undefined);
  }, []);
  const all = [...edition].sort((a, b) => (a.date < b.date ? 1 : -1));
  const hero = all.find((a) => isHeadline(a.category));
  const rest = all.filter((a) => a.slug !== hero?.slug);
  const side = rest.slice(0, 5);
  const grid = rest.slice(5, 11);
  const more = rest.slice(11);

  return (
    <div className="space-y-10">
      <AdSlot slot="home-top" />
      <div className="grid gap-8 lg:grid-cols-12">
        {hero ? (
          <div className="lg:col-span-8">
            <ArticleCard article={hero} variant="hero" />
          </div>
        ) : (
          <div className="lg:col-span-8 rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-20 text-center">
            <p className="font-display text-3xl">हेडलाइन छैन</p>
            <p className="mt-2 text-sm text-muted">
              ब्यानरका लागि विभाग <span className="font-semibold text-crimson">हेडलाइन</span> मा समाचार
              प्रकाशन गर्नुहोस्।
            </p>
          </div>
        )}
        <aside className="rounded-2xl border border-line bg-surface px-4 py-3 lg:col-span-4">
          <p className="section-title">ताजा शीर्षक</p>
          {side.length ? (
            side.map((a, i) => (
              <ArticleCard key={a.slug} article={a} variant="compact" rank={i + 1} />
            ))
          ) : (
            <p className="py-6 text-sm text-muted">नयाँ शीर्षक आउनेछ।</p>
          )}
        </aside>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <p className="section-title">थप समाचार</p>
          {more.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="text" />
          ))}
        </section>
        <aside className="space-y-6 lg:col-span-4">
          <AdSlot slot="home-sidebar" />
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="section-title">ग्यालरी झलक</p>
            {albums.length ? (
              <ul className="mt-3 space-y-2">
                {albums.slice(0, 5).map((g) => {
                  const thumb = g.coverUrl || g.photos[0]?.imageUrl;
                  return (
                    <li key={g.slug}>
                      <Link
                        to="/gallery/$slug"
                        params={{ slug: g.slug }}
                        className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-chip"
                      >
                        {thumb ? (
                          <img src={thumb} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid size-14 place-items-center rounded-lg bg-chip text-xs">फोटो</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{g.title}</p>
                          <p className="text-xs text-muted">{g.place}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">ग्यालरी खाली छ।</p>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="section-title">डाइरेक्ट्री</p>
            {places.length ? (
              <ul className="mt-3 grid gap-3">
                {places.slice(0, 4).map((d) => (
                  <li key={d.id}>
                    <DirectoryListing
                      item={d}
                      categoryLabel={dirCats.find((c) => c.slug === d.category)?.label}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">डाइरेक्ट्री खाली छ।</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
