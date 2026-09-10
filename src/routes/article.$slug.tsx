import { Link, createFileRoute } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { MembersWidget } from "@/components/members-widget";
import { PostSidebar } from "@/components/post-sidebar";
import { ShareBar } from "@/components/share-bar";
import { StoryEngage } from "@/components/story-engage";
import { TextResizer } from "@/components/text-resizer";
import { displayTitle, formatDate, toNpDigits } from "@/data/articles";
import { getPublishedStory } from "@/lib/desk";
import { useEdition, useEditionArticle } from "@/lib/edition";
import { usePrefs } from "@/lib/prefs";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { incrementView } from "@/lib/views";

export const Route = createFileRoute("/article/$slug")({
  loader: ({ params }) => getPublishedStory({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    const story = loaderData;
    const origin = "https://www.kalaiyaonline.com";
    const slug = story?.slug || params.slug;
    const headline = story?.title?.trim() || "KalaiyaOnline";
    const title = story?.title ? `${story.title} | KalaiyaOnline` : "KalaiyaOnline";
    const desc = (story?.excerpt || story?.body || "कलैया, बारा र मधेशको स्थानीय समाचार।")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    const image = story?.imageUrl
      ? `${origin}/share-image/article/${encodeURIComponent(slug)}`
      : `${origin}/og.jpg`;
    const url = `${origin}/article/${encodeURIComponent(slug)}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index,follow" },
        { property: "og:type", content: "article" },
        { property: "og:locale", content: "ne_NP" },
        { property: "og:site_name", content: "KalaiyaOnline" },
        { property: "og:title", content: headline },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: headline },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: headline },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { article, missing } = useEditionArticle(slug);
  const edition = useEdition();
  const { toggleSaved, isSaved, textScale } = usePrefs();
  const cats = useCategories();
  const [views, setViews] = useState(0);

  useEffect(() => {
    if (!slug) return;
    void incrementView({ data: { kind: "story", key: slug } })
      .then((row) => setViews(row.views))
      .catch(() => undefined);
  }, [slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="kicker">समाचार</p>
        <h1 className="mt-2 font-display text-4xl font-bold">यो रिपोर्ट भेटिएन</h1>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper"
        >
          गृहपृष्ठ
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-10 w-2/3 animate-pulse rounded bg-chip" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-chip" />
      </div>
    );
  }

  const title = displayTitle(article);
  const saved = isSaved(article.slug);
  const related = edition
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 2);
  const paragraphs = article.body.length ? article.body : [article.excerpt];

  return (
    <article className="pb-6">
      <AdSlot slot="article-top" className="mb-6" />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-sm">
        <header className="px-5 pt-6 text-center sm:px-8">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#14934e]">
            {categoryLabel(cats, article.category)}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{article.author}</span>
            <span>·</span>
            <span>{formatDate(article.date)}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#14934e]">
              <Eye className="size-4" />
              {toNpDigits(views)} पटक हेरियो
            </span>
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pb-2">
            <TextResizer />
            <button
              type="button"
              onClick={() => toggleSaved(article.slug)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-paper px-3 text-sm font-medium hover:border-crimson"
            >
              {saved ? <BookmarkCheck className="size-4 text-crimson" /> : <Bookmark className="size-4" />}
              {saved ? "सुरक्षित छ" : "सेभ गर्नुहोस्"}
            </button>
          </div>
        </header>

        {article.excerpt ? (
          <p className="mx-5 mt-4 rounded-2xl bg-[#f6f6f6] px-5 py-4 text-center text-lg leading-relaxed sm:mx-8">
            {article.excerpt}
          </p>
        ) : null}

        {article.imageUrl ? (
          <figure className="mt-6 px-5 sm:px-8">
            <img src={article.imageUrl} alt={title} className="max-h-[32rem] w-full rounded-2xl object-cover" />
          </figure>
        ) : null}

        {article.gallery?.length ? (
          <div className="mt-4 grid gap-3 px-5 sm:grid-cols-2 sm:px-8">
            {article.gallery.map((src) => (
              <img key={src} src={src} alt="" className="h-56 w-full rounded-2xl object-cover" />
            ))}
          </div>
        ) : null}

        <div className="px-5 py-8 sm:px-8">
          <div
            className="article-body space-y-6 font-display leading-[1.9] text-ink"
            style={{ fontSize: `${1.15 * textScale}rem` }}
          >
            {paragraphs.map((p, i) => (
              <p key={`${i}-${p.slice(0, 16)}`}>{p}</p>
            ))}
          </div>
          {article.tags.length ? (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/search"
                  search={{ q: tag }}
                  className="rounded-full bg-[#e7f4eb] px-3 py-1 text-xs font-semibold text-[#0b6b38] hover:bg-[#14934e] hover:text-white"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
          <ShareBar path={`/article/${article.slug}`} title={title} />
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <AdSlot slot="article-bottom" className="mt-6" />
        <StoryEngage slug={article.slug} />
        {related.length ? (
          <section className="mt-10">
            <h2 className="mb-4 text-center font-display text-2xl">
              सम्बन्धित {categoryLabel(cats, article.category)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        ) : null}
        <div className="mt-8">
          <MembersWidget />
        </div>
      </div>
      </div>
      <PostSidebar articles={edition} currentSlug={article.slug} />
      </div>
    </article>
  );
}
