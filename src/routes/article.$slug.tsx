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
    <article className="mx-auto max-w-3xl">
      <AdSlot slot="article-top" className="mb-6" />
      {article.imageUrl ? (
        <figure className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl sm:border sm:border-line">
          <img src={article.imageUrl} alt={title} className="max-h-[32rem] w-full object-cover" />
        </figure>
      ) : null}

      <div className="mt-6">
        <p className="kicker">
          {categoryLabel(cats, article.category)} · {article.location}
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal leading-snug tracking-tight sm:text-4xl">
          {title}
        </h1>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{article.author}</span>
          <span>· {formatDate(article.date)}</span>
          <span className="inline-flex items-center gap-1 text-crimson">
            <Eye className="size-4" />
            {toNpDigits(views)} पटक हेरियो
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <TextResizer />
          <button
            type="button"
            onClick={() => toggleSaved(article.slug)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-paper px-3 text-sm font-medium text-ink hover:border-crimson"
          >
            {saved ? <BookmarkCheck className="size-4 text-crimson" /> : <Bookmark className="size-4" />}
            {saved ? "सुरक्षित छ" : "सेभ गर्नुहोस्"}
          </button>
        </div>
      </div>

      <div
        className="article-body mt-10 space-y-6 font-display font-medium leading-[1.8] text-ink"
        style={{ fontSize: `${1.2 * textScale}rem` }}
      >
        {paragraphs.map((p, i) => (
          <p key={`${i}-${p.slice(0, 16)}`} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-bold first-letter:text-crimson" : ""}>
            {p}
          </p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <Link
            key={tag}
            to="/search"
            search={{ q: tag }}
            className="rounded-full border border-line bg-chip px-3 py-1 text-xs font-medium hover:border-crimson"
          >
            {tag}
          </Link>
        ))}
      </div>

      <ShareBar path={`/article/${article.slug}`} title={title} />
      <AdSlot slot="article-bottom" className="mt-6" />
      <StoryEngage slug={article.slug} />
      <div className="mt-8">
        <MembersWidget />
      </div>

      {related.length ? (
        <section className="mt-12">
          <h2 className="section-title">सम्बन्धित</h2>
          {related.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="text" />
          ))}
        </section>
      ) : null}
    </article>
  );
}
