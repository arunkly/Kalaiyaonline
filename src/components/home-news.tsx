import { Link } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { isHeadline, type Article } from "@/data/articles";
import { categoryLabel } from "@/lib/use-categories";
import type { DeskCategory } from "@/lib/desk";

const SECTION_ORDER = ["local", "politics", "business", "sports"];

function matches(article: Article, slug: string, label: string) {
  const cat = (article.category || "").toLowerCase();
  return cat === slug.toLowerCase() || cat === label.toLowerCase() || article.category === label;
}

function take(pool: Article[], n: number, used: Set<string>) {
  const out: Article[] = [];
  for (const a of pool) {
    if (used.has(a.slug)) continue;
    used.add(a.slug);
    out.push(a);
    if (out.length === n) break;
  }
  return out;
}

function SectionHead({ label, slug }: { label: string; slug: string }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b-[3px] border-crimson">
      <h2 className="bg-crimson px-3 py-1.5 font-display text-base font-extrabold text-white sm:text-lg">{label}</h2>
      <Link to="/category/$slug" params={{ slug }} className="px-2 text-sm font-bold text-crimson hover:underline">
        सबै ›
      </Link>
    </div>
  );
}

export function HomeNews({ articles, cats }: { articles: Article[]; cats: DeskCategory[] }) {
  const used = new Set<string>();
  const all = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
  const headlines = all.filter((a) => isHeadline(a.category));
  const rest = all.filter((a) => !isHeadline(a.category));
  const leadPool = headlines.length ? headlines : all;
  const lead = take(leadPool, 1, used)[0];
  const strip = take(headlines.length ? headlines : rest, 4, used);
  const latest = all.filter((a) => a.slug !== lead?.slug).slice(0, 10);

  const orderedCats = [
    ...SECTION_ORDER.map((slug) => cats.find((c) => c.slug === slug)).filter(Boolean),
    ...cats.filter((c) => c.slug !== "headline" && !SECTION_ORDER.includes(c.slug)),
  ] as typeof cats;

  const sections = orderedCats
    .map((c) => {
      const items = take(
        rest.filter((a) => matches(a, c.slug, c.label)),
        5,
        used,
      );
      return { slug: c.slug, label: c.label || categoryLabel(cats, c.slug), items };
    })
    .filter((s) => s.items.length);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 bg-white p-3 sm:p-5 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          {lead ? (
            <ArticleCard article={lead} variant="ok-lead" />
          ) : (
            <div className="border border-dashed border-line px-5 py-16 text-center">
              <p className="font-display text-3xl">हेडलाइन छैन</p>
            </div>
          )}
          {strip.length ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {strip.map((a) => (
                <ArticleCard key={a.slug} article={a} variant="standard" />
              ))}
            </div>
          ) : null}
        </div>
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <div className="flex items-center justify-between border-b-[3px] border-crimson">
              <h2 className="bg-crimson px-3 py-1.5 font-display text-base font-extrabold text-white">ताजा अपडेट</h2>
              <span className="px-2 text-[11px] font-bold text-crimson">+</span>
            </div>
            <div>
              {latest.map((a) => (
                <ArticleCard key={a.slug} article={a} variant="ok-row" />
              ))}
              {latest.length === 0 ? <p className="py-6 text-sm text-muted">समाचार छैन।</p> : null}
            </div>
          </div>
        </aside>
      </div>

      {sections.map((section) => {
        const featured = section.items[0];
        const more = section.items.slice(1, 5);
        return (
          <section key={section.slug} className="bg-white p-3 sm:p-5">
            <SectionHead label={section.label} slug={section.slug} />
            <div className="grid gap-6 md:grid-cols-2">
              {featured ? <ArticleCard article={featured} variant="ok-lead" /> : null}
              <div>
                {more.map((a) => (
                  <ArticleCard key={a.slug} article={a} variant="ok-thumb" />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
