import { Link, createFileRoute } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { MembersWidget } from "@/components/members-widget";
import { ShareBar } from "@/components/share-bar";
import { StoryEngage } from "@/components/story-engage";
import { TextResizer } from "@/components/text-resizer";
import { displayTitle, formatDate, toNpDigits } from "@/data/articles";
import { getPublishedStory } from "@/lib/desk";
import { useEdition, useEditionArticle } from "@/lib/edition";
import { usePrefs } from "@/lib/prefs";
import { absoluteUrl, siteOrigin } from "@/lib/site-url";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { incrementView } from "@/lib/views";

export const Route = createFileRoute("/article/$slug")({
  loader: ({ params }) => getPublishedStory({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const story = loaderData;
    const origin = siteOrigin();
    const title = story?.title ? `${story.title} | KalaiyaOnline` : "KalaiyaOnline";
    const desc = story?.excerpt || "कलैया, बारा र मधेशको स्थानीय समाचार।";
    const image = absoluteUrl(story?.imageUrl || "/og.jpg", origin);
    const url = `${origin}/article/${story?.slug ?? ""}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "KalaiyaOnline" },
        { property: "og:title", content: story?.title || "KalaiyaOnline" },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:alt", content: story?.title || "KalaiyaOnline" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: story?.title || "KalaiyaOnline" },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
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
    .slice(0, 3);
  const paragraphs = article.body.length ? article.body : [article.excerpt];

  return (
    <article className="pb-6">
      <AdSlot slot="article-top" className="mb-6" />

      <div className="overflow-hidden rounded-[1.75rem] bg-[#10261a] text-white">
        {article.imageUrl ? (
          <div className="relative min-h-64 sm:min-h-[22rem]">
            <img src={article.imageUrl} alt={title} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10261a] via-[#10261a]/55 to-transparent" />
            <div className="relative flex min-h-64 flex-col justify-end p-5 sm:min-h-[22rem] sm:p-8">
              <p className="w-fit rounded-full bg-[#ff6f00] px-3 py-1 text-[11px] font-bold tracking-wide">
                {categoryLabel(cats, article.category)}
              </p>
              <h1 className="mt-3 max-w-4xl font-display text-3xl leading-tight sm:text-5xl">{title}</h1>
              <p className="mt-3 text-sm text-white/75">
                {article.location} · {article.author} · {formatDate(article.date)}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <p className="w-fit rounded-full bg-[#ff6f00] px-3 py-1 text-[11px] font-bold">
              {categoryLabel(cats, article.category)}
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">{title}</h1>
          </div>
        )}
      </div>

      <div className="mx-auto mt-5 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted shadow-sm">
          <p className="inline-flex items-center gap-1 font-semibold text-[#14934e]">
            <Eye className="size-4" />
            {toNpDigits(views)} पटक हेरियो
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>

        <div
          className="article-body mt-8 space-y-6 font-display leading-[1.9] text-ink"
          style={{ fontSize: `${1.15 * textScale}rem` }}
        >
          {paragraphs.map((p, i) => (
            <p
              key={`${i}-${p.slice(0, 16)}`}
              className={
                i === 0
                  ? "rounded-2xl bg-[#f3f7f4] px-5 py-4 text-ink-soft first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-bold first-letter:text-[#14934e]"
                  : ""
              }
            >
              {p}
            </p>
          ))}
        </div>

        {article.tags.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
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
        <AdSlot slot="article-bottom" className="mt-6" />
        <StoryEngage slug={article.slug} />
        <div className="mt-8">
          <MembersWidget />
        </div>

        {related.length ? (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-2xl">सम्बन्धित समाचार</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
