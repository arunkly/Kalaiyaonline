import { Link, createFileRoute } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { DirectoryListing } from "@/components/directory-listing";
import { HomeNews } from "@/components/home-news";
import { useFeatures } from "@/components/features-provider";
import { listDirCategories, listDirEntries, type DirCategory, type DirItem } from "@/lib/directory-desk";
import { listGalleryPosts, type GalleryPost } from "@/lib/gallery-desk";
import { useEdition } from "@/lib/edition";
import { useCategories } from "@/lib/use-categories";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const edition = useEdition();
  const cats = useCategories();
  const features = useFeatures();
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

  return (
    <div className="space-y-8">
      <AdSlot slot="home-top" />
      <HomeNews articles={all} cats={cats} />

      {features.gallery || features.directory ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          {features.gallery ? (
            <section className="min-w-0 overflow-hidden bg-white p-4">
              <div className="mb-3 flex items-center justify-between border-b-[3px] border-crimson">
                <p className="bg-crimson px-3 py-1.5 font-display text-base font-extrabold text-white">ग्यालरी</p>
                <Link to="/gallery" className="px-2 text-sm font-bold text-crimson">
                  सबै ›
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
                          <img src={thumb} alt="" className="h-28 w-full object-cover sm:h-24" />
                        ) : (
                          <div className="h-28 bg-chip sm:h-24" />
                        )}
                        <p className="mt-2 line-clamp-2 text-sm font-semibold">{g.title}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}
          {features.directory ? (
            <section className="bg-white p-4">
              <div className="mb-3 flex items-center justify-between border-b-[3px] border-crimson">
                <p className="bg-crimson px-3 py-1.5 font-display text-base font-extrabold text-white">डाइरेक्ट्री</p>
                <Link to="/directory" className="px-2 text-sm font-bold text-crimson">
                  सबै ›
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
          ) : null}
        </div>
      ) : null}
      <AdSlot slot="home-sidebar" />
    </div>
  );
}
