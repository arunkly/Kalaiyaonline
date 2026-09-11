import { useEffect, useMemo, useState } from "react";
import { articles, type Article, type Category } from "@/data/articles";
import {
  getPublishedStory,
  listPublishedStories,
  type DeskStory,
} from "@/lib/desk";

function parseGalleryField(raw?: string | string[] | null) {
  if (Array.isArray(raw)) return raw.filter((v) => typeof v === "string" && v.trim());
  if (!raw || typeof raw !== "string") return [] as string[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && Boolean(v.trim())) : [];
  } catch {
    return [];
  }
}

export function deskToArticle(s: DeskStory): Article {
  const created = s.createdAt;
  const date =
    typeof created === "string" && created
      ? created
      : new Date().toISOString();
  const bodyText = typeof s.body === "string" ? s.body : String(s.body ?? "");
  const tagText = typeof s.tags === "string" ? s.tags : "";
  return {
    slug: String(s.slug || ""),
    title: String(s.title || ""),
    excerpt: String(s.excerpt ?? ""),
    body: bodyText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
    category: (s.category || "local") as Category,
    tags: tagText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    author: "K O",
    date,
    location: String(s.location || "कलैया"),
    imageUrl: s.imageUrl || undefined,
    gallery: parseGalleryField(s.galleryUrls),
    featured: true,
    sourceUrl: `https://kalaiyaonline.com/${s.slug}/`,
    lang: "np",
  };
}

export function useEdition() {
  const [extra, setExtra] = useState<Article[]>([]);

  useEffect(() => {
    void listPublishedStories()
      .then((rows) =>
        setExtra(
          (rows ?? []).flatMap((row) => {
            try {
              return [deskToArticle(row)];
            } catch {
              return [];
            }
          }),
        ),
      )
      .catch(() => setExtra([]));
  }, []);

  return useMemo(() => {
    const seen = new Set(extra.map((a) => a.slug));
    return [...extra, ...articles.filter((a) => !seen.has(a.slug))];
  }, [extra]);
}

export function useEditionArticle(slug: string) {
  const edition = useEdition();
  const fromList = edition.find((a) => a.slug === slug);
  const [fetched, setFetched] = useState<Article | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFetched(null);
    setFailed(false);
    if (!slug) return;
    void getPublishedStory({ data: { slug } })
      .then((row) => {
        setFetched(row ? deskToArticle(row) : null);
        setFailed(!row);
      })
      .catch(() => {
        setFetched(null);
        setFailed(true);
      });
  }, [slug]);

  return {
    article: fromList ?? fetched,
    missing: failed && !fromList,
  };
}