import { Link } from "@tanstack/react-router";
import { displayTitle, formatDate, toNpDigits, type Article } from "@/data/articles";
import { cn } from "@/lib/cn";
import { categoryLabel, useCategories } from "@/lib/use-categories";

export function ArticleCard({
  article,
  variant = "standard",
  rank,
}: {
  article: Article;
  variant?: "hero" | "standard" | "compact" | "text";
  rank?: number;
}) {
  const cats = useCategories();
  const label = categoryLabel(cats, article.category);
  const title = displayTitle(article);
  const date = formatDate(article.date);

  if (variant === "hero") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group card-lift block overflow-hidden rounded-2xl border border-line bg-ink text-paper"
      >
        <div className="relative min-h-72 overflow-hidden sm:min-h-[26rem]">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div
            className={`relative flex min-h-72 flex-col justify-end px-5 py-8 sm:min-h-[26rem] sm:px-10 sm:py-12 ${
              article.imageUrl
                ? "bg-gradient-to-t from-ink via-ink/75 to-ink/10"
                : "bg-gradient-to-br from-crimson-deep via-ink to-crimson"
            }`}
          >
            <p className="inline-flex w-fit items-center rounded-full bg-paper/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-paper backdrop-blur-sm">
              {article.breaking ? "ब्रेकिङ" : label} · {article.location}
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl leading-[1.15] tracking-tight sm:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-paper/82 sm:text-base">
              {article.excerpt}
            </p>
            <p className="mt-6 text-xs tracking-wide text-paper/60">
              {article.author} · {date}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact" || variant === "text") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group grid grid-cols-[auto_auto_1fr] items-start gap-3 border-b border-line py-3.5 last:border-b-0"
      >
        {typeof rank === "number" ? (
          <span className="w-7 pt-0.5 font-sans text-xl font-bold leading-none text-crimson">
            {toNpDigits(rank)}
          </span>
        ) : null}
        {article.imageUrl && variant === "compact" ? (
          <img
            src={article.imageUrl}
            alt=""
            className="size-16 rounded-lg object-cover sm:size-[4.5rem]"
          />
        ) : (
          <span className="hidden" />
        )}
        <span>
          <p className="text-[11px] font-semibold tracking-wider text-crimson">{label}</p>
          <h3 className="mt-1 font-display text-lg leading-snug group-hover:text-crimson sm:text-xl">
            {title}
          </h3>
          {variant === "text" ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{article.excerpt}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">{date}</p>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/article/$slug"
      params={{ slug: article.slug }}
      className={cn(
        "group card-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface",
      )}
    >
      <div className="relative overflow-hidden bg-chip">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-48"
          />
        ) : (
          <div className="h-28 bg-gradient-to-br from-crimson to-crimson-deep" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-wider text-crimson">
          {label}
          {article.breaking ? " · ब्रेकिङ" : ""}
        </p>
        <h3 className="mt-2 font-display text-xl leading-snug group-hover:text-crimson">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">
          {article.excerpt}
        </p>
        <p className="mt-3 text-xs text-muted">
          {article.location} · {date}
        </p>
      </div>
    </Link>
  );
}
