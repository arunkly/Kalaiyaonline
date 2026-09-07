import { Link, createFileRoute } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { isHeadline, toNpDigits } from "@/data/articles";
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
  const side = rest.slice(0, 6);

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

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <p className="mb-4 font-display text-2xl">आजको डेस्क</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {rest.slice(0, 6).map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
        <aside className="rounded-[1.5rem] border border-line bg-white p-4 lg:col-span-4">
          <p className="text-sm font-bold tracking-[0.12em] text-[#14934e]">ताजा शीर्षक</p>
          <div className="mt-2 divide-y divide-line">
            {side.length ? (
              side.map((a, i) => (
                <Link key={a.slug} to="/article/$slug" params={{ slug: a.slug }} className="flex gap-3 py-3">
                  <span className="w-8 font-display text-2xl font-semibold text-[#ff6f00]">{toNpDigits(i + 1)}</span>
                  <p className="line-clamp-3 font-display text-xl leading-snug text-ink">{a.titleNp || a.title}</p>
                </Link>
              ))
            ) : (
              <p className="py-6 text-sm text-muted">नयाँ शीर्षक आउनेछ।</p>
            )}
          </div>
        </aside>
      </div>

      {rest.slice(6).length ? (
        <section>
          <p className="mb-4 font-display text-2xl">थप समाचार</p>
          <div className="space-y-2 rounded-[1.5rem] bg-white p-2">
            {rest.slice(6).map((a) => (
              <ArticleCard key={a.slug} article={a} variant="text" />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[1.5rem] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-2xl">ग्यालरी</p>
            <Link to="/gallery" className="text-sm font-semibold text-[#14934e]">
              सबै
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {albums.slice(0, 8).map((g) => {
              const thumb = g.coverUrl || g.photos[0]?.imageUrl;
              return (
                <Link key={g.slug} to="/gallery/$slug" params={{ slug: g.slug }} className="w-36 shrink-0">
                  {thumb ? <img src={thumb} alt="" className="h-24 w-36 rounded-xl object-cover" /> : <div className="h-24 rounded-xl bg-chip" />}
                  <p className="mt-2 line-clamp-2 text-sm">{g.title}</p>
                </Link>
              );
            })}
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
