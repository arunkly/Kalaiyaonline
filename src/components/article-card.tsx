import { Link } from "@tanstack/react-router";
import { displayTitle, formatDate, timeAgoNp, toNpDigits, type Article } from "@/data/articles";
import { cn } from "@/lib/cn";
import { categoryLabel, useCategories } from "@/lib/use-categories";

export function ArticleCard({
  article,
  variant = "standard",
  rank,
}: {
  article: Article;
  variant?: "hero" | "standard" | "compact" | "text" | "ok-lead" | "ok-row" | "ok-thumb";
  rank?: number;
}) {
  const cats = useCategories();
  const label = categoryLabel(cats, article.category);
  const title = displayTitle(article);
  const date = formatDate(article.date);
  const ago = timeAgoNp(article.date);

  if (variant === "ok-lead") {
    return (
      <Link to="/article/$slug" params={{ slug: article.slug }} className="group block">
        <div className="overflow-hidden bg-[#111]">
          {article.imageUrl ? (
            <img src={article.imageUrl} alt="" className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:opacity-95" />
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-crimson to-crimson-deep" />
          )}
        </div>
        <p className="mt-3 text-[12px] font-extrabold tracking-wide text-crimson">{label}</p>
        <h2 className="mt-1 font-display text-[1.65rem] font-extrabold leading-[1.25] text-ink group-hover:text-crimson sm:text-4xl">
          {title}
        </h2>
        {article.excerpt ? (
          <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink-soft">{article.excerpt}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          {ago}
          {article.location ? ` · ${article.location}` : ""}
        </p>
      </Link>
    );
  }

  if (variant === "ok-row") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group flex gap-3 border-b border-line py-3 last:border-b-0"
      >
        <span className="w-[4.6rem] shrink-0 pt-0.5 text-[11px] font-semibold leading-snug text-muted">{ago}</span>
        <h3 className="font-display text-[15px] font-bold leading-snug group-hover:text-crimson">{title}</h3>
      </Link>
    );
  }

  if (variant === "ok-thumb") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group flex gap-3 border-b border-line py-3 last:border-b-0"
      >
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="h-[4.4rem] w-[5.6rem] shrink-0 object-cover" />
        ) : (
          <span className="h-[4.4rem] w-[5.6rem] shrink-0 bg-chip" />
        )}
        <span className="min-w-0">
          <p className="text-[11px] font-bold text-crimson">{label}</p>
          <h3 className="mt-0.5 line-clamp-3 font-display text-[15px] font-bold leading-snug group-hover:text-crimson">
            {title}
          </h3>
        </span>
      </Link>
    );
  }

  if (variant === "hero") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group grid overflow-hidden rounded-[1.75rem] bg-[#10261a] text-white lg:grid-cols-12"
      >
        <div className="relative min-h-64 lg:col-span-7 lg:min-h-[28rem]">
          {article.imageUrl ? (
            <img src={article.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#14934e] to-[#10261a]" />
          )}
          <span className="absolute left-4 top-4 rounded-full bg-[#ff6f00] px-3 py-1 text-[11px] font-bold tracking-wide">
            हेडलाइन
          </span>
        </div>
        <div className="flex flex-col justify-end p-6 lg:col-span-5 lg:p-8">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#8dffb0]">{label} · {article.location}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
          {article.excerpt ? <p className="mt-3 line-clamp-3 text-sm text-white/75">{article.excerpt}</p> : null}
          <p className="mt-5 text-xs text-white/55">{article.author} · {date}</p>
        </div>
      </Link>
    );
  }

  if (variant === "standard") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group block"
      >
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
        ) : (
          <div className="aspect-[16/10] bg-chip" />
        )}
        <p className="mt-2 text-[11px] font-bold text-crimson">{label}</p>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug group-hover:text-crimson">{title}</h3>
        <p className="mt-1 text-xs text-muted">{ago}</p>
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
      className={cn("group card-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface")}
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
        <h3 className="mt-2 font-display text-xl leading-snug group-hover:text-crimson">{title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">{article.excerpt}</p>
        <p className="mt-3 text-xs text-muted">
          {article.location} · {date}
        </p>
      </div>
    </Link>
  );
}
